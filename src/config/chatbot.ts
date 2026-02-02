// src/config/chatbot.ts - FIXED: Dashboard-only loading with proper cleanup
export interface ChatbotConfig {
  enabled: boolean;
  embedCode: string;
  title?: string;
  subtitle?: string;
  sendUserData?: boolean;
  dashboardOnly?: boolean;
}

// 🎯 CHATBOT CONFIGURATION - DASHBOARD ONLY
export const chatbotConfig: ChatbotConfig = {
  enabled: true, // Set to false to disable chatbot completely
  dashboardOnly: true, // Only load chatbot on dashboard page
  
  // 📋 CHATBOT EMBED CODE
  embedCode: `
   <script type="text/javascript">
  (function(d, t) {
      var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
      v.onload = function() {
        window.voiceflow.chat.load({
          verify: { projectID: '6980bade39d47173c7b31641' },
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
  
  // 👤 Send user data to chatbot
  sendUserData: true
};

// FIXED: Helper function to check if chatbot should load on current page
export const shouldLoadChatbot = (pathname: string): boolean => {
  if (!chatbotConfig.enabled) {
    console.log('🤖 Chatbot disabled in config');
    return false;
  }
  
  if (!chatbotConfig.dashboardOnly) {
    console.log('🤖 Chatbot enabled on all pages');
    return true;
  }
  
  // Only load on dashboard page
  const shouldLoad = pathname === '/dashboard';
  console.log(`🤖 Chatbot dashboard-only mode: ${shouldLoad ? 'LOAD' : 'SKIP'} for ${pathname}`);
  return shouldLoad;
};

// Helper function to update user data in window for chatbot access
export const setUserDataForChatbot = (user: any, profile: any) => {
  if (typeof window !== 'undefined') {
    (window as any).currentUser = {
      id: user?.id,
      email: user?.email,
      name: profile?.display_name || user?.email?.split('@')[0] || 'User'
    };
    console.log('🤖 User data set for chatbot:', (window as any).currentUser);
  }
};

// FIXED: Enhanced chatbot cleanup function
export const removeChatbot = () => {
  if (typeof window !== 'undefined') {
    console.log('🧹 Starting chatbot cleanup...');
    
    // Remove Voiceflow widget container
    const voiceflowWidget = document.querySelector('[data-voiceflow-widget]');
    if (voiceflowWidget) {
      voiceflowWidget.remove();
      console.log('🧹 Removed Voiceflow widget container');
    }
    
    // Remove any Voiceflow iframes
    const voiceflowIframes = document.querySelectorAll('iframe[src*="voiceflow"]');
    voiceflowIframes.forEach(iframe => {
      iframe.remove();
      console.log('🧹 Removed Voiceflow iframe');
    });
    
    // Remove chatbot scripts
    const chatbotScripts = document.querySelectorAll('script[src*="voiceflow"], script[src*="widget"]');
    chatbotScripts.forEach(script => {
      script.remove();
      console.log('🧹 Removed chatbot script');
    });
    
    // Clear Voiceflow global references
    if ((window as any).voiceflow) {
      try {
        // Try to destroy the chat widget properly
        if ((window as any).voiceflow.chat?.destroy) {
          (window as any).voiceflow.chat.destroy();
          console.log('🧹 Called voiceflow.chat.destroy()');
        }
        
        // Clear the global reference
        delete (window as any).voiceflow;
        console.log('🧹 Cleared window.voiceflow');
      } catch (error) {
        console.log('🧹 Chatbot cleanup completed (with minor errors)');
      }
    }
    
    // Clear user data
    if ((window as any).currentUser) {
      delete (window as any).currentUser;
      console.log('🧹 Cleared user data');
    }
    
    // Clear chatbot container
    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer) {
      // Don't clear the container completely, just remove any injected content
      const scripts = chatbotContainer.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      console.log('🧹 Cleaned chatbot container');
    }
    
    console.log('✅ Chatbot cleanup completed');
  }
};
