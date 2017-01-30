import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull.js';

// Lib
import './_init.js';

ExchangeRingPulls.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
ExchangeRingPulls.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
ExchangeRingPulls.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
