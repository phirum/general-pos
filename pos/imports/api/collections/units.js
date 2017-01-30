export const Units = new Mongo.Collection('units');

Units.schema = new SimpleSchema({
  name: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    optional: true
  },
})


Units.attachSchema(Units.schema);
