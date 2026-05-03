const bcrypt = require('bcryptjs');
bcrypt.hash('admin123', 10).then(hash => {
    console.log("\n=================================================");
    console.log("COPY THIS HASH:");
    console.log(hash);
    console.log("=================================================\n");
});