TabularTables = {};

TabularTables.NodesList = new Tabular.Table({
  name: "NodesList",
  collection: Nodes,
  columns : [
      { data: 'id',  title: 'ID' },
      { data: 'data.name',  title: 'Name' },
      { data: 'data.group',  title: 'Group' },
      { data: 'data.lat',  title: 'Latitude' },
      { data: 'data.lng',  title: 'Longitude' },
      { data: 'data.starred',  title: 'Starred' },
      {data: "createdAt", title: "Created At"}
    ]
});

TabularTables.EdgesList = new Tabular.Table({
  name: "EdgesList",
  collection: Edges,
  columns : [
    { data: 'data.id',  title: 'ID' },
    { data: 'source',  title: 'Source' },
    { data: 'target',  title: 'Target' },
    {data: "createdAt", title: "Created At"},
  ]
});
