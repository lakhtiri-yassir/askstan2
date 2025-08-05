# Chatbot Integration Setup

## How to Add Your Chatbot

1. **Open the configuration file**: `src/config/chatbot.config.ts`

2. **Replace the `embedCode`** with your actual chatbot embed code:
   ```typescript
   embedCode: `
     <!-- PASTE YOUR CHATBOT EMBED CODE HERE -->
     <div id="my-chatbot">
       <!-- Your chatbot HTML -->
     </div>
     <script>
       // Your chatbot initialization script
       MyCustomChatbot.init({
         containerId: 'my-chatbot',
         apiKey: 'your-api-key',
         // other configuration
       });
     </script>
   `
   ```

3. **Optional: Add initialization script** if your chatbot needs additional setup:
   ```typescript
   initializationScript: `
     // Additional JavaScript that runs after your chatbot loads
     if (window.MyCustomChatbot) {
       window.MyCustomChatbot.setUser({
         id: userId,
         email: userEmail
       });
     }
   `
   ```

4. **Customize container settings** if needed:
   ```typescript
   containerSettings: {
     width: '100%',
     height: '700px', // Adjust height as needed
     borderRadius: '12px',
     boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
     backgroundColor: '#ffffff'
   }
   ```

## Common Chatbot Platforms

### Voiceflow
```javascript
embedCode: `
  <div id="voiceflow-widget"></div>
  <script>
    (function(d, t) {
      var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
      v.onload = function() {
        window.voiceflow.chat.load({
          verify: { projectID: 'YOUR_PROJECT_ID' },
          url: 'https://general-runtime.voiceflow.com',
          versionID: 'production'
        });
      }
      v.src = "https://cdn.voiceflow.com/widget/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
    })(document, 'script');
  </script>
`
```

### Intercom
```javascript
embedCode: `
  <script>
    window.intercomSettings = {
      api_base: "https://widget.intercom.io",
      app_id: "YOUR_APP_ID"
    };
  </script>
  <script>(function(){var w=window;var ic=w.Intercom;...})()</script>
`
```

### Custom iframe
```javascript
embedCode: `
  <iframe 
    src="https://your-chatbot-url.com" 
    width="100%" 
    height="500px" 
    frameborder="0"
    style="border-radius: 12px;">
  </iframe>
`
```

## Testing Your Integration

1. Start the development server: `npm run dev`
2. Navigate to the dashboard
3. Your chatbot should appear in the main chat area
4. Test the functionality to ensure it works correctly

## Troubleshooting

- Check browser console for any JavaScript errors
- Ensure your chatbot embed code is complete and valid
- Verify that external scripts are loading correctly
- Test in different browsers to ensure compatibility

## User Data Integration

The chatbot configuration automatically passes user data to your chatbot if it supports it:

```javascript
// This data is automatically available in your chatbot:
{
  id: 'user-id',
  email: 'user@example.com',
  subscription: 'monthly' // or 'yearly' or 'free'
}
```

Use this data to personalize the chatbot experience for each user.