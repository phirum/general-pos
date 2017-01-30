import {RequirePassword} from '../../imports/api/collections/requirePassword.js';

// Lib
import './_init.js';

RequirePassword.permit(['insert'])
    .Pos_ifSetting()
    .allowInClientCode();
RequirePassword.permit(['update'])
    .Pos_ifSetting()
    .allowInClientCode();
RequirePassword.permit(['remove'])
    .Pos_ifSetting()
    .allowInClientCode();
