import {Reps} from '../../imports/api/collections/rep.js';

// Lib
import './_init.js';

Reps.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Reps.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Reps.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
