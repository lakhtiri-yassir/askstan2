// src/config/chatbot.ts - Updated to Only Load on Dashboard
export interface ChatbotConfig {
  enabled: boolean;
  embedCode: string;
  title?: string;
  subtitle?: string;
  sendUserData?: boolean;
  dashboardOnly?: boolean; // New property to restrict to dashboard
}

// 🎯 CHATBOT CONFIGURATION - RESTRICTED TO DASHBOARD ONLY
export const chatbotConfig: ChatbotConfig = {
  enabled: true, // Set to false to disable chatbot completely
  dashboardOnly: true, // NEW: Only load chatbot on dashboard page
  
  // 📋 PASTE YOUR CHATBOT EMBED CODE HERE:
  embedCode: `
    <script type="text/javascript">
  (function(d, t) {
      var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
      v.onload = function() {
        window.voiceflow.chat.load({
          verify: { projectID: '68a4fac9fff4e9f33fff84ed' },
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

// Helper function to check if chatbot should load on current page
export const shouldLoadChatbot = (pathname: string): boolean => {
  if (!chatbotConfig.enabled) return false;
  if (!chatbotConfig.dashboardOnly) return true;
  
  // Only load on dashboard page
  return pathname === '/dashboard';
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

// Helper function to remove chatbot when leaving dashboard
export const removeChatbot = () => {
  if (typeof window !== 'undefined') {
    // Remove Voiceflow widget if it exists
    const voiceflowWidget = document.querySelector('[data-voiceflow-widget]');
    if (voiceflowWidget) {
      voiceflowWidget.remove();
    }
    
    // Clear any global Voiceflow references
    if ((window as any).voiceflow) {
      try {
        (window as any).voiceflow.chat.destroy?.();
      } catch (error) {
        console.log('Chatbot cleanup completed');
      }
    }
  }
};