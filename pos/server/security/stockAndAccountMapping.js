import {StockAndAccountMapping} from '../../imports/api/collections/stockAndAccountMapping.js';

// Lib
import './_init.js';

StockAndAccountMapping.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
StockAndAccountMapping.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
StockAndAccountMapping.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
