import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull.js';

// Lib
import './_init.js';

CompanyExchangeRingPulls.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
CompanyExchangeRingPulls.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
CompanyExchangeRingPulls.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
