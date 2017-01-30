import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';

// Lib
import './_init.js';

AccountIntegrationSetting.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
AccountIntegrationSetting.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
AccountIntegrationSetting.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
