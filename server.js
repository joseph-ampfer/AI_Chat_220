const express = require('express');
//const fs = require('fs')


const app = express()
app.use(express.json());
app.use(express.static('public'))
const port = 3030

/* ==== HTML ENDPOINTS ===== */
// app.get('/', (req, res)=> {
// 	res.send(fs.readFileSync('./index.html','utf8'));
// })

// app.get('/detail', (req, res)=> {
// 	res.send('HTML endpoint: detail');
// })


/* ====== API ENDPOINTS ====== */




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
