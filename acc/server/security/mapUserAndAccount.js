import {MapUserAndAccount} from '../../imports/api/collections/mapUserAndAccount';
import './_init.js';
/**
 * chart of Account
 */

MapUserAndAccount.permit(['insert'])
    .Acc_ifDataInsert()
    .allowInClientCode();
MapUserAndAccount.permit(['update'])
    .Acc_ifDataUpdate()
    .allowInClientCode();
MapUserAndAccount.permit(['remove'])
    .Acc_ifDataRemove()
    .allowInClientCode();
