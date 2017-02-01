import {ExchangeRates} from '../../imports/api/collections/exchangeRate.js';

// Lib
import './_init.js';

ExchangeRates.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
ExchangeRates.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
ExchangeRates.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
