Meteor.methods({
    lookupUserBranch(userId){
        let user = Meteor.users.aggregate([
            {$match: {_id: userId}},
            {
                $unwind: {path: '$rolesBranch'}
            },
            {
                $lookup: {
                    from: "core_branch",
                    localField: "rolesBranch",
                    foreignField: "_id",
                    as: "branchDoc"
                }
            },
            {$unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}},

            {
                $group: {
                    _id: '$_id',
                    rolesBranch: {
                        $addToSet: {$ifNull: ["$branchDoc.khName", "$branchDoc.enName"]}
                    }
                }
            }
        ]);
        return user[0];
    }
});