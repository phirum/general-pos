import {Units} from '../../imports/api/collections/units.js';

// Lib
import './_init.js';

Units.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Units.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Units.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
