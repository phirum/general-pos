import {QuantityRangeMapping} from '../../imports/api/collections/quantityRangeMapping.js';

// Lib
import './_init.js';

QuantityRangeMapping.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
QuantityRangeMapping.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
QuantityRangeMapping.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
