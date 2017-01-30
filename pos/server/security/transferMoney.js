import {TransferMoney} from '../../imports/api/collections/transferMoney.js';

// Lib
import './_init.js';

TransferMoney.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
TransferMoney.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
TransferMoney.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
