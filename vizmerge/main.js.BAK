var w = 960,
        h = 600;

var y = d3.scale.linear()
    .range([h, 0]);

var chart = d3.select(".chart")
    .attr("width", w)
    .attr("height", h);


d3.json("../data/timeseries.json", function(error, data) {
  console.log(data);
    var margin = {top: 20, right: 20, bottom: 80, left: 40},
                        width = w,
                        height = h-100,
                        gap = 0,
                        ease = 'cubic-in-out',
                        bars;
            
            var duration = 500;

            var time_width = width - margin.left - margin.right,
                time_height = height - margin.top - margin.bottom;

            // Construct our SVG object.
            var svg = d3.select(".chart")
                .append("svg")
                .style("background","#fff")
                .attr("width", time_width + margin.left + margin.right)
                .attr("height", time_height + margin.top + margin.bottom)
                    .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // tooltip
            var tooltip = d3.select(".chart")
                .append("g")
                .style("position", "absolute")
                .style("z-index", "10")
                .style("visibility", "hidden")
                .text("a simple tooltip")
                .style("font-size",9)
                .style("color", "#404040");

                d3.selectAll(".axis").remove();
                d3.selectAll(".timebar").remove();

                var newData = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].time > 1388534400 && data[i].time < 1420070400 )  newData.push( data[i] )
                }
                var _data = newData.map(function (d) {
                    d.time = d.time*1000;
                     return d;
                });

                // Scales.
                var x = d3.time.scale().range([time_width/_data.length/2, time_width-time_width/_data.length/2]);
                var y = d3.scale.linear().range([time_height, 0]);

                // X-axis.
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .tickFormat(d3.time.format("%Y %m"));

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .ticks(10);

                // Set scale domains. 
                x.domain(d3.extent(_data, function(d) { return d.time; }));
                y.domain([0, d3.max(_data, function(d) { return d.count; })]);
                
                svg.transition().duration(duration).attr({width: width, height: height})
                
                // Call x-axis. 
                d3.select(".x.axis")
                    .transition()
                    .duration(duration)
                    .ease(ease)
                    .call(xAxis);

                // Draw bars. 
                bars = svg.append("g")
                    .attr("class","timebar")
                    .selectAll(".timebar")
                    .data( _data, function(d) { return d.time; });

                d3.select(".timebar")
                    .append("g")
                    .attr("transform","translate(50,10)")
                    .append("text")
                    .style("font-size",9)
                    .style("color", "#404040")
                    .text("Volume of messages")

                bars.transition()
                    .duration(duration)
                    .ease(ease)
                    .attr("x", function(d) { return x(d.time) - time_width/_data.length/2; })
                    .attr("width", time_width / _data.length)
                    .attr("y", function(d) { return y(d.count); })
                    .attr("height", function(d) { return time_height - y(d.count);});

                var bars_enter =  bars.enter().append("rect")
                    .attr("class", "count")
                    .attr("width", time_width / _data.length)
                    .attr("x", function(d) { return x(d.time) - (time_width/_data.length)/2; })
                    .attr("y", time_height)
                    .attr("height", 0)
                    
                bars_enter.transition().duration(1000)
                    .attr("y", function(d) { return y(d.count); })
                    .attr("height", function(d) { return time_height - y(d.count) })
                    .style("fill", function(d,i){ return "steelblue" });
                    // .style("fill", function(d){ return (d.selected) ? "black" : "#CCC"})

                var format = d3.time.format("%A %d %B - %H:%m");
                // var graphClicked = false;


                // bars_enter
                //     .on("mouseover",function(d,i,event){
                //         d3.select(this).style("fill", "red");
                //         tooltip.text(d.count  + " on " +   format(d.time) )
                //         tooltip.style("visibility", "visible");
                //     })
                //     .on("mousemove", function(){
                //         return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
                //     })
                //     .on("mouseout",function(d,i){
                //         if (!graphClicked) {
                //             d3.select(this).style("fill", "steelblue");
                //             return tooltip.style("visibility", "hidden");
                //         }
                //     })
                //     .on("click",function(d,i){
                //         graphClicked = (graphClicked) ? false : true;
                //         console.log(graphClicked);
                //     })

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + time_height + ")")
                    .call(xAxis)
                    .selectAll("text")
                        .attr("font-family", "sans-serif")
                        .attr("fill", "#4B4B4B")
                        .attr("font-size", 10)
                        .style("text-anchor", "end")
                        .attr("dx", "-.8em")
                        .attr("dy", ".15em")
                        .attr("transform", function(d) {
                            return "rotate(-65)" 
                            })
                        // .attr("transform", "rotate(-90)" );

                svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(0,0)")
                    .call(yAxis)
                    .selectAll("text")
                        .attr("font-family", "sans-serif")
                        .attr("fill", "#4B4B4B")
                        .attr("font-size", 10)
                
                svg.select(".y")
                    .append("text") // caption
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", ".71em")
                        .style("text-anchor", "end")
                        .attr("text-anchor", "middle")  
                        .attr("font-family", "sans-serif")
                        .attr("fill", "#4B4B4B")
                        // .style("text-decoration", "bold")  
                        .attr("font-size", 10)
                        .text("Qty per day (tweets)")
              
                svg.selectAll(".domain")
                    .attr("fill", "none")
                    .attr("stroke", "#000")

                bars.exit().transition().style({opacity: 0}).remove();

                duration = 500;

                updateChart()

    function updateChart() {
      console.log('test');
      bars.data(data)
        .style("fill", function(d){ 
            return (d.selected)?"steelblue":"#CCC"})
    }

});
