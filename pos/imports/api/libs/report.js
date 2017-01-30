export default class ReportFn {
    static checkIfUserHasRights({currentUser, selector}){
        if(currentUser) {
            let user = Meteor.users.findOne({_id: Meteor.userId()});
            for(let i =0 ; i < selector.branchId.$in.length; i++){
                if(!_.includes(user.rolesBranch, selector.branchId.$in[i])) {
                    _.pull(selector.branchId.$in, selector.branchId.$in[i]);
                }
            }
        }
        return selector;
    }
}