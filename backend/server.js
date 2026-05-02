require('dotenv').config();

const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');

const PORT= process.env.PORT || 3000;

const app=express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Connected Successfully"))
.catch(err => console.error(err));

app.get('/', (req,res) => {
    res.send("API Running");
});

app.listen(3000, () => {
    console.log(`Server running on PORT ${PORT}`)
});
