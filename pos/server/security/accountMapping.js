import {AccountMapping} from '../../imports/api/collections/accountMapping.js';

// Lib
import './_init.js';

AccountMapping.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
AccountMapping.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
AccountMapping.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
