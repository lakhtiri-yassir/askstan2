// src/config/chatbot.ts - UNIFIED CHATBOT CONFIGURATION
export interface ChatbotConfig {
  enabled: boolean;
  embedCode: string;
  title?: string;
  subtitle?: string;
  sendUserData?: boolean;
}

// 🎯 CHATBOT CONFIGURATION - JUST PASTE YOUR EMBED CODE HERE!
export const chatbotConfig: ChatbotConfig = {
  enabled: true, // Set to false to disable chatbot completely
  
  // 📋 PASTE YOUR CHATBOT EMBED CODE HERE:
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
  
  // 🎨 Optional UI customization
  title: 'AI Coach Ready!',
  subtitle: 'Click the chat widget to start your conversation.',
  
  // 👤 Send user data to chatbot (works with most providers)
  sendUserData: true
};

// Helper function to update user data in window for chatbot access
export const setUserDataForChatbot = (user: any, profile: any) => {
  if (typeof window !== 'undefined') {
    (window as any).currentUser = {
      id: user?.id,
      email: user?.email,
      name: profile?.display_name || user?.email?.split('@')[0] || 'User'
    };
  }
};