import {Terms} from '../../imports/api/collections/terms.js';

// Lib
import './_init.js';

Terms.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Terms.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Terms.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
