const express = require('express')
const bodyParser = require('body-parser')
const { promisify } = require('util')
const request = promisify(require('request').defaults({
    headers: {
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    jar: true
}))

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
// EXAMPLE: /inventory/76561199172982948
// ?tradable=true||false
// ?sort=name||tradable
app.get('/inventory/:steamid', async (req, res) => {
    if ('steamid' in req.params){
        //проверка валидности параметра
        if (req.params['steamid'] && !isNaN(parseInt(req.params['steamid']))){
            const steamid = req.params['steamid']
            const response = await request(`https://steamcommunity.com/inventory/${steamid}/730/2?l=en`)
            if (response.statusCode == 200){
            
                const sort = req.query['sort'] || null
                const tradable = req.query['tradable'] || null
                let inv = (JSON.parse(response.body)).descriptions
                let items = []
                
                inv.forEach(val => items.push({
                    market_hash_name: val['market_hash_name'],
                    tradable: val['tradable']
                }))
                // сортировка по квери
                if (sort == 'name'){
                    items = items.sort((a,b) => a.market_hash_name.localeCompare(b.market_hash_name))
                }else if (sort == 'tradable'){
                    items = items.sort((a,b) => b.tradable - a.tradable)
                }
                if (tradable == 'true'){
                    items = items.filter(val => val.tradable ? 1 : 0)
                }else if(tradable == 'false'){
                    items = items.filter(val => val.tradable ? 0 : 1)
                }
                return res.json({success: true, error: null, assets: items})
            }else{
                return res.json({success: false, error: "Steam API Error"})
            }
        } return res.json({success:false, error: "Incorrect SteamID64"})
    } return res.json({success:false, error: "Please specify SteamID64"})
})

app.get('/*', function(req, res){
    res.status(404)
    return res.send('404')
})
app.listen(3030, () => console.log('Server started at :3030'))
