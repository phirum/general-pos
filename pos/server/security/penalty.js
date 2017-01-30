import {Penalty} from '../../imports/api/collections/penalty.js';

// Lib
import './_init.js';

Penalty.permit(['insert'])
    .Pos_ifSetting()
    .allowInClientCode();
Penalty.permit(['update'])
    .Pos_ifSetting()
    .allowInClientCode();
Penalty.permit(['remove'])
    .Pos_ifSetting()
    .allowInClientCode();
