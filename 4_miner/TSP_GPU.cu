/*
Copyright (c) 2011, Texas State University-San Marcos. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted for academic, research, experimental, or personal use provided
that the following conditions are met:

   * Redistributions of source code must retain the above copyright notice,
     this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above copyright notice,
     this list of conditions and the following disclaimer in the documentation
     and/or other materials provided with the distribution.
   * Neither the name of Texas State University-San Marcos nor the names of its
     contributors may be used to endorse or promote products derived from this
     software without specific prior written permission.

For all other uses, please contact the Office for Commercialization and Industry
Relations at Texas State University-San Marcos <http://www.txstate.edu/ocir/>.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Authors: Martin Burtscher and Molly A. O'Neil
*/

#include <stdlib.h>
#include <stdio.h>
#include <cuda.h>

#define MULT 1103515245
#define ADD 12345
#define MASK 0x7fffffff

#define CIPOW2 128  /* power of 2 and as large as the largest possible input */

#define TOURS110 (65536*2)

__device__ volatile unsigned int gblkcnt, gcurr;
__device__ volatile unsigned long long best;

/******************************************************************************/
/* Kernels to initialize best tour tracking and GPU state.                    */
/******************************************************************************/

__global__ void ResetKernel()
{
  register int k;

  k = threadIdx.x + blockIdx.x * blockDim.x;
  if (k == 0) {
    best = 0xffffffffffffffffULL;
  }
}

__global__ void Reset110Kernel(int blocksTimesThreads)
{
  gblkcnt = 0;
  gcurr = blocksTimesThreads;
}

/******************************************************************************/
/* The GPU TSP kernel: for each thread, initializes a first climber and       */
/* randomizes a starting tour, then evaluates IHC steps until a local minimum */
/* is found, at which point a new climber is obtained from the worklist.      */
/******************************************************************************/

__global__
__launch_bounds__(1024, 1)
void TSP110Kernel(int *gdist, int *gresult, int touroffset, int cities, int tours, int *gtours)
{
  register int i, j, change, mini, minj, minchange, randx, citiesm1, citiespad;
  register int ti, tj, tiplus1, tjplus1, dist_i_iplus1, ti_p1, mytour, from, to, cost;
  register int *sdist_ti, *sdist_tiplus1, *ltour;
  register unsigned long long mycost, current;
  unsigned char tour[110];  // local memory for coalesced accesses, shifted by one entry relative to gresult
  __shared__ int sdist[110 * 110];

  for (i = threadIdx.x; i < cities * cities; i += blockDim.x) {
    sdist[i] = gdist[i];
  }
  __syncthreads();

  citiesm1 = cities - 1;
  citiespad = (citiesm1 + 33) & (~31);
  mytour = threadIdx.x + blockIdx.x * blockDim.x;
  if (mytour < tours) {
    // Default starting tour for this thread's first climber
    for (i = 0; i < citiesm1; i++) {
      tour[i] = i + 1;
    }
    tour[citiesm1] = 0;

    // Randomize the initial tour
    randx = mytour + touroffset;  // use mytour as random seed
    for (i = 0; i < citiesm1; i++) {
      randx = (MULT * randx + ADD) & MASK;
      j = randx % citiesm1;
      to = tour[i];
      tour[i] = tour[j];
      tour[j] = to;
    }

    do {
      minchange = 0;
      ti = 0;  // tour[-1]
      ti_p1= tour[0];
      // Evaluate the 2-opt moves: Remove edges (i, i+1) and (j, j+1) and replace with (i, j) and (i+1, j+1)
      // Evaluate each city i (except first/last) against all cities from i+2 to last city, thus not evaluating
      // duplicate reversals or adjacent city pairs, which cannot improve tour.
      for (i = 2; i < cities; i++) {  // loop bias = 2, loop from i=1 to i=cities-2
        tiplus1 = ti_p1 * cities;
        dist_i_iplus1 = sdist[ti + ti_p1];
        tj = ti_p1 = tour[i-1];
        sdist_ti = &sdist[ti]; // Save pointers to i and i+1 rows of distance matrix 
        sdist_tiplus1 = &sdist[tiplus1];
#pragma unroll 8
        for (j = i; j < cities; j++) {
          tjplus1 = tour[j];
          // Instead of recomputing new tour length after 2-opt move, just calculate the change from
          // adding edges (i, j) & (i+1, j+1) and removing edges (i, i+1) & (j, j+1)
          change = sdist_ti[tj] + sdist_tiplus1[tjplus1] - dist_i_iplus1 - sdist[tj * cities + tjplus1];
          tj = tjplus1;
          // If tour length reduction is new minimum, save the (i, j) coordinates of the 2-opt move
          if ((minchange > change) && (j < cities)) {
            minchange = change;
            mini = i;
            minj = j;
          }
        }
        ti = tiplus1;
      }

      // If this climber found an improved tour, perform the city ordering swap
      // and continue evaluating with a new IHC step
      if (minchange < 0) {
        // new tour is 0 to mini, minj downto mini+1, minj+1 to cities
        i = mini - 2;
        j = minj - 1;
        while (i < j) {
          to = tour[j];
          tour[j] = tour[i];
          tour[i] = to;
          i++;
          j--;
        }
      } 
      // Otherwise, this climber found a local minimum, so compute the tour cost,
      // record if best solution so far, and get a new climber from the worklist
      else {
        cost = 0;
        from = 0;
        for (i = 0; i < citiesm1; i++) {
          to = tour[i];
          cost += sdist[from * cities + to];
          from = to;
        }
        mycost = cost + sdist[from];
        mycost = (mycost << 32) + mytour + touroffset;

        current = best;
        // Is our local minimum the best solution found?  If so, compare-and-swap to
        // save it as the current best
        while (mycost < current) {
          atomicCAS((unsigned long long *)&best, current, mycost);
          current = best;
        }
        if (mycost == current) {
          ltour = &gtours[mytour * citiespad];
          for (i = 0; i < citiesm1; i++) {
            ltour[i] = tour[i];
          }
        }
        // Get the next climber and randomize a new tour
        mytour = atomicAdd((int *)&gcurr, 1);
        if (mytour < tours) {
          for (i = 0; i < citiesm1; i++) {
            tour[i] = i + 1;
          }
          tour[citiesm1] = 0;

          randx = mytour + touroffset;
          for (i = 0; i < citiesm1; i++) {
            randx = (MULT * randx + ADD) & MASK;
            j = randx % (citiesm1);
            to = tour[i];
            tour[i] = tour[j];
            tour[j] = to;
          }
        }
      }
    } while (mytour < tours);
  }

  __syncthreads();
  if (threadIdx.x == 0) {
    to = gridDim.x - 1;
    if (to == atomicInc((unsigned int *)&gblkcnt, to)) {
      mytour = best & 0xffffffff;
      gresult[0] = best >> 32;
      gresult[1] = 0;
      gresult[2] = mytour;
      mytour %= TOURS110;
      ltour = &gtours[mytour * citiespad];
      for (i = 0; i < citiesm1; i++) {
        gresult[i+3] = ltour[i];
      }
    }
  }
}

/******************************************************************************/
/* Function to read the TSP database input file and initialize the distance   */
/* matrix.                                                                    */
/******************************************************************************/

static int readFile(char *filename, int *dist)
{
  register int i, j, ch, cnt, cities;
  int i1;
  float i2, i3;
  register float *posx, *posy;
  register double dx, dy;
  register FILE *f;
  char str[256];

  f = fopen(filename, "r+t");
  if (f == NULL) {fprintf(stderr, "could not open file %s\n", filename); exit(-1);}

  ch = getc(f);  while ((ch != EOF) && (ch != '\n')) ch = getc(f);
  ch = getc(f);  while ((ch != EOF) && (ch != '\n')) ch = getc(f);
  ch = getc(f);  while ((ch != EOF) && (ch != '\n')) ch = getc(f);

  ch = getc(f);  while ((ch != EOF) && (ch != ':')) ch = getc(f);
  fscanf(f, "%s\n", str);
  cities = atoi(str);
  if (cities == 0) {
    fprintf(stderr, "%d cities\n", cities);
    exit(-1);
  }
  if (cities >= CIPOW2) {
    fprintf(stderr, "%d cities is too large\n", cities);
    exit(-1);
  }
  posx = (float *)malloc(sizeof(float) * cities);
  posy = (float *)malloc(sizeof(float) * cities);
  if ((posx == NULL) || (posy == NULL)) {
    fprintf(stderr, "out of memory\n");
    exit(-1);
  }

  ch = getc(f);  while ((ch != EOF) && (ch != '\n')) ch = getc(f);
  fscanf(f, "%s\n", str);
  if (strcmp(str, "NODE_COORD_SECTION") != 0) {
    fprintf(stderr, "wrong file format\n");
    exit(-1);
  }

  cnt = 0;
  while (fscanf(f, "%d %f %f\n", &i1, &i2, &i3)) {
    posx[cnt] = i2;
    posy[cnt] = i3;
    cnt++;
    if (cnt > cities) {fprintf(stderr, "input too long\n"); exit(-1);}
    if (cnt != i1) {fprintf(stderr, "input line mismatch: expected %d instead of %d\n", cnt, i1); exit(-1);}
  }
  if (cnt != cities) {
    fprintf(stderr, "read %d instead of %d cities\n", cnt, cities);
    exit(-1);
  }
  fscanf(f, "%s", str);
  if (strcmp(str, "EOF") != 0) {
    fprintf(stderr, "didn't see 'EOF' at end of file\n");
    exit(-1);
  }
  fclose(f);

  for (i = 0; i < cities; i++) {
    for (j = 0; j < cities; j++) {
      dx = posx[i] - posx[j];
      dy = posy[i] - posy[j];
      dist[j * cities + i] = dist[i * cities + j] = (int)(sqrt(dx * dx + dy * dy) + 0.5);
    }
    dist[i * cities + i] = 0x3fffffff;  // half of maxint
  }

  free(posx);
  free(posy);

  return cities;
}

/******************************************************************************/
/* Functions to synchronize GPU threads and check for error status, as well   */
/* as to ascertain number of SMs in device and proper architecture version.      */
/******************************************************************************/

static void CudaTest(char *msg)
{
  cudaError_t e;

  cudaThreadSynchronize();
  if (cudaSuccess != (e = cudaGetLastError())) {
    fprintf(stderr, "%s: %d\n", msg, e);
    fprintf(stderr, "%s\n", cudaGetErrorString(e));
    exit(-1);
  }
}

static int VerifySystemParameters(int *SMs)
{
  int deviceCount, currentDevice = 0, bestSMArch = 0;
  int maxComputePerf = 0, maxPerfDevice = 0, SMPerMP;
  int archCoresSM[3] = { 1, 8, 32 };
  cudaDeviceProp deviceProp;
  
  cudaGetDeviceCount(&deviceCount);
  if(deviceCount <= 0) {
    fprintf(stderr, "There is no device supporting CUDA\n");
    exit(-1);
  }

  // Find the best SM architecture device
  while(currentDevice < deviceCount) {
    cudaGetDeviceProperties(&deviceProp, currentDevice);
    if(deviceProp.major > 0 && deviceProp.major < 9999) {
      bestSMArch = max(bestSMArch, deviceProp.major);
    }
    currentDevice++;
  }

  // Find the best GPU device
  currentDevice = 0;
  while(currentDevice < deviceCount) {
    cudaGetDeviceProperties(&deviceProp, currentDevice);
    if(deviceProp.major == 9999 && deviceProp.minor == 9999) {
      SMPerMP = 1;
    } else if (deviceProp.major <= 2) {
      SMPerMP = archCoresSM[deviceProp.major];
    } else { // SM major > 2
      SMPerMP = archCoresSM[2];
    }
    int computePerf = deviceProp.multiProcessorCount * SMPerMP * deviceProp.clockRate;
    if((deviceProp.major == bestSMArch) && (computePerf > maxComputePerf)) {
      maxComputePerf = computePerf;
      maxPerfDevice = currentDevice;
    }
    currentDevice++;
  }

  cudaGetDeviceProperties(&deviceProp, maxPerfDevice);
  if(deviceProp.major < 2) {
    fprintf(stderr, "No device found with compute capability 2.0 or above\n");
    exit(-1);
  }

  *SMs = deviceProp.multiProcessorCount;
  return maxPerfDevice;
}

/******************************************************************************/
/* Run function reads input database and launches the GPU kernels.            */
/* Prints to std out: GPU best tour and tour cost, as well as error from      */
/* optimal tour read from input file.                                         */
/******************************************************************************/

void run(char *filename, int tours, int SMs)
{
  int *lgdist, tour, blocks, best;
  int *lgresult, *lgtours, *lscratch;
  int dist[CIPOW2 * CIPOW2];
  int result[3 + CIPOW2];
  int cities;

  cities = readFile(filename, dist);
  printf("%s: %d tours with %d cities each\n", filename, tours, cities);
  
  if (tours < 1) {
     fprintf(stderr, "tour count must be positive\n");
     exit(-1);
  }

  if (cudaSuccess != cudaMalloc((void **)&lgtours, ((cities + 32) & (~31)) * min(TOURS110, tours) * sizeof(int))) fprintf(stderr, "could not allocate gtours\n");  CudaTest("couldn't allocate gtours");
  if (cudaSuccess != cudaMalloc((void **)&lscratch, ((cities + 32) & (~31)) * min(TOURS110, tours) * sizeof(int))) fprintf(stderr, "could not allocate scratch\n");  CudaTest("couldn't allocate scratch");
  if (cudaSuccess != cudaMalloc((void **)&lgresult, sizeof(int) * (cities + 3))) fprintf(stderr, "could not allocate gresult\n");  CudaTest("couldn't allocate gresult");
  if (cudaSuccess != cudaMalloc((void **)&lgdist, sizeof(int) * cities * cities)) fprintf(stderr, "could not allocate gdist\n");  CudaTest("couldn't allocate gdist");
  if (cudaSuccess != cudaMemcpy(lgdist, dist, sizeof(int) * cities * cities, cudaMemcpyHostToDevice)) fprintf(stderr, "copying of dist to device failed\n");  CudaTest("dist copy to device failed");

  ResetKernel<<<SMs*3, 512>>>();
  best = 0x7fffffff;
  tour = 0;
  if (cities <= 110) {
    blocks = min(tours, TOURS110);
    while (tours > tour) {
      Reset110Kernel<<<1, 1>>>(SMs*2*512);
      TSP110Kernel<<<SMs, 1024>>>(lgdist, lgresult, tour, cities, blocks, lgtours);

      if (cudaSuccess != cudaMemcpy(result, lgresult, sizeof(int) * 2, cudaMemcpyDeviceToHost)) fprintf(stderr, "copying of result from device failed\n");  CudaTest("result copy from device failed");
      if (best > result[0]) {
        best = result[0];
        if (cudaSuccess != cudaMemcpy(result, lgresult, sizeof(int) * (cities + 3), cudaMemcpyDeviceToHost)) fprintf(stderr, "copying of result from device failed\n");  CudaTest("result copy from device failed");
      }

      tour += blocks;
      blocks = min(tours-tour, TOURS110);
    }
  }
  else {
    fprintf(stderr, "city count must be <= 110\n");
    exit(-1);
  }

  printf("GPU min cost = %d\n", best);
  printf("GPU min tour = %d\n", result[2]);

  cudaFree(lgtours);
  cudaFree(lscratch);
  cudaFree(lgresult);
  cudaFree(lgdist);
}


/******************************************************************************/
/* MAIN                                                                       */
/* Usage:  ./TSP_GPU <path to input database> <number of climbers>            */
/******************************************************************************/

int main(int argc, char *argv[])
{
  register int climbers, SMs, deviceID;

  if(argc != 3) {
    fprintf(stderr, "usage: %s <path to input database> <number of climbers>\n", argv[0]);
    exit(-1);
  }

  printf("\nTSP_GPU v1.0  Copyright (c) 2011 Texas State University-San Marcos\n");
  
  deviceID = VerifySystemParameters(&SMs);
  cudaSetDevice(deviceID);
  CudaTest("initialization");

  cudaFuncSetCacheConfig(TSP110Kernel, cudaFuncCachePreferShared);

  climbers = atoi(argv[2]);
  run(argv[1], climbers, SMs);

  return 0;
}

