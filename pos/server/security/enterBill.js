import {EnterBills} from '../../imports/api/collections/enterBill.js';

// Lib
import './_init.js';

EnterBills.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
EnterBills.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
EnterBills.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
