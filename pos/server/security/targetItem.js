import {TargetItem} from '../../imports/api/collections/targetItem.js';

// Lib
import './_init.js';

TargetItem.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
TargetItem.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
TargetItem.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
