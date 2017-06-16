import {Closing} from '../../imports/api/collections/closing.js';

// Lib
import './_init.js';

Closing.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Closing.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Closing.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
