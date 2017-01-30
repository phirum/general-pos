import {Categories} from '../../imports/api/collections/category.js';

// Lib
import './_init.js';

Categories.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
Categories.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
Categories.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
