const mongoose = require('mongoose');
const journeyOperator = require('./objects/journey-operator');

const { Schema } = mongoose;

const SafeJourneySchema = new Schema(Object.assign(
  { duplicatedAt: Date },
  journeyOperator,
), { timestamps: true });

module.exports = SafeJourneySchema;