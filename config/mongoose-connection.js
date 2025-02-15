const mongoose = require('mongoose');

mongoose
.connect("mongodb+srv://ds3590778:xe9tpvTVbna5kCKB@cluster0.rpa7d.mongodb.net/NEXON?retryWrites=true&w=majority&appName=Cluster0")
.then(function(){
    console.log("Connected to database")
})
.catch(function(err){
    console.log(err);
})

module.exports= mongoose.connection;
