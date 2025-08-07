export interface ChatbotConfig {
  embedCode: string;
  initializationScript?: string;
  containerSettings: {
    width: string;
    height: string;
    borderRadius: string;
    boxShadow: string;
    backgroundColor: string;
  };
  customStyles?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Default configuration - USER WILL PASTE THEIR CHATBOT CODE HERE
export const defaultChatbotConfig: ChatbotConfig = {
  // PASTE YOUR CHATBOT EMBED CODE HERE
  embedCode: `
    <script type="text/javascript">
  (function(d, t) {
      var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
      v.onload = function() {
        window.voiceflow.chat.load({
          verify: { projectID: '688d150bdb7293eb99bdbe16' },
          url: 'https://general-runtime.voiceflow.com',
          versionID: 'production',
          voice: {
            url: "https://runtime-api.voiceflow.com"
          }
        });
      }
      v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
  })(document, 'script');
</script>
  `,

  // Optional initialization script that runs after embed code loads
  initializationScript: `
    // OPTIONAL: Add any additional JavaScript that needs to run after your chatbot loads
    // This will be executed after the embedCode is inserted into the DOM
    
    // Example:
    // if (window.YourChatbot) {
    //   window.YourChatbot.setUser({
    //     id: userId,
    //     email: userEmail,
    //     name: userName
    //   });
    // }
  `,

  containerSettings: {
    width: "100%",
    height: "600px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#ffffff",
  },

  // Optional custom CSS to style the chatbot container
  customStyles: `
    .chatbot-container {
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.9);
    }
    
    .chatbot-container iframe {
      border-radius: 12px;
    }
  `,

  onLoad: () => {
    console.log("Chatbot loaded successfully");
  },

  onError: (error: Error) => {
    console.error("Chatbot loading error:", error);
  },
};

// Function to get user-specific chatbot configuration
export const getChatbotConfig = (user?: any): ChatbotConfig => {
  return {
    ...defaultChatbotConfig,
    // You can modify the embed code based on user data here
    initializationScript: `
      ${defaultChatbotConfig.initializationScript}
      
      // Pass user data to your chatbot if needed
      if (typeof window !== 'undefined' && window.YourChatbot) {
        window.YourChatbot.setUser({
          id: '${user?.id || "anonymous"}',
          email: '${user?.email || ""}',
          subscription: '${user?.subscription?.plan_type || "free"}'
        });
      }
    `,
  };
};
