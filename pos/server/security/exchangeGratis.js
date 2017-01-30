import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';

// Lib
import './_init.js';

ExchangeGratis.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
ExchangeGratis.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
ExchangeGratis.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
