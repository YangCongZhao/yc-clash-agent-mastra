## 上传阿拉丁agent代码
```javascript
async function getBitcoinPrice{
    try{
        const response = await fetch(
            'https://m4wf6yrc34kth6uok7htjuassq0ichsz.lambda-url.ap-southeast-1.on.aws/api/agents/clashAgent/generate',
            {
                method:'POST',
                headers:{
                    accept:'*/*',
                    'Content-Type':'application/json'
                },
                // This is the request body I'm sending
                body: JSON.stringify（｛
                messages：［
                ｛
                    role： 'user'，
                    // This is the user's message
                    content：'Current Bitcoin price'，
                ｝
                
            }
        )
        if（!response.ok）｛
            throw new Error（`HTTP error! Status: ${response.status}`）;
        }
        const data = await response.json();
        return data.text
    }catch(errpr){
        throw error
    }
      
}
```
