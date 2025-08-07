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

// FIXED: Voiceflow-specific configuration that works with their global widget approach
export const defaultChatbotConfig: ChatbotConfig = {
  // EMPTY embed code - Voiceflow loads globally, not in container
  embedCode: `
    <!-- Voiceflow widget will be injected globally -->
    <div id="voiceflow-placeholder" style="text-align: center; padding: 2rem; color: #666;">
      <div class="loading-animation" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 2s linear infinite;"></div>
      <p style="margin-top: 1rem; font-family: Inter, sans-serif;">Loading your AI coach...</p>
    </div>
    
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `,

  // FIXED: Proper Voiceflow initialization that runs globally
  initializationScript: `
    // VOICEFLOW INITIALIZATION - This must run globally, not in container
    console.log('🤖 Initializing Voiceflow widget...');
    
    (function(d, t) {
      // Check if script already exists
      if (document.querySelector('script[src*="voiceflow.com/widget-next/bundle.mjs"]')) {
        console.log('📍 Voiceflow script already exists, attempting to reinitialize...');
        
        // Try to reinitialize if window.voiceflow exists
        if (window.voiceflow && window.voiceflow.chat) {
          try {
            window.voiceflow.chat.destroy();  // Clear any existing instance
          } catch (e) {
            console.log('⚠️  Could not destroy existing instance:', e);
          }
          
          setTimeout(() => {
            window.voiceflow.chat.load({
              verify: { projectID: '688d150bdb7293eb99bdbe16' },
              url: 'https://general-runtime.voiceflow.com',
              versionID: 'production',
              voice: {
                url: "https://runtime-api.voiceflow.com"
              }
            });
          }, 500);
        }
        return;
      }
      
      var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
      v.onload = function() {
        console.log('✅ Voiceflow script loaded, initializing chat...');
        
        if (window.voiceflow && window.voiceflow.chat) {
          window.voiceflow.chat.load({
            verify: { projectID: '688d150bdb7293eb99bdbe16' },
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production',
            voice: {
              url: "https://runtime-api.voiceflow.com"
            }
          });
          
          // Hide the placeholder after successful load
          setTimeout(() => {
            const placeholder = document.getElementById('voiceflow-placeholder');
            if (placeholder) {
              placeholder.style.display = 'none';
            }
          }, 2000);
          
          console.log('🎉 Voiceflow chat initialized successfully!');
        } else {
          console.error('❌ Voiceflow object not found after script load');
        }
      };
      
      v.onerror = function() {
        console.error('❌ Failed to load Voiceflow script');
        const placeholder = document.getElementById('voiceflow-placeholder');
        if (placeholder) {
          placeholder.innerHTML = '<p style="color: #e74c3c;">Failed to load AI coach. Please refresh the page.</p>';
        }
      };
      
      v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
      v.type = "text/javascript";
      s.parentNode.insertBefore(v, s);
      
      console.log('📡 Voiceflow script injection started...');
    })(document, 'script');
  `,

  containerSettings: {
    width: "100%",
    height: "600px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#ffffff",
  },

  // FIXED: Styles that work with Voiceflow's approach
  customStyles: `
    .chatbot-container {
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.9);
      position: relative;
      overflow: hidden;
    }
    
    /* Style the Voiceflow widget when it appears */
    div[class*="vfrc-"] {
      border-radius: 12px !important;
      box-shadow: none !important; /* We handle shadow in container */
    }
    
    /* Ensure placeholder is centered and visible */
    #voiceflow-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
  `,

  onLoad: () => {
    console.log("🎯 Chatbot container loaded - Voiceflow should initialize globally");
  },

  onError: (error: Error) => {
    console.error("💥 Chatbot loading error:", error);
  },
};

// Function to get user-specific chatbot configuration
export const getChatbotConfig = (user?: any): ChatbotConfig => {
  return {
    ...defaultChatbotConfig,
    // FIXED: User data integration for Voiceflow
    initializationScript: `
      ${defaultChatbotConfig.initializationScript}
      
      // VOICEFLOW USER DATA INTEGRATION
      // Wait for Voiceflow to fully initialize before setting user data
      const setVoiceflowUserData = () => {
        if (window.voiceflow && window.voiceflow.chat && window.voiceflow.chat.interact) {
          try {
            // Set user data in Voiceflow
            window.voiceflow.chat.interact({
              type: 'launch',
              payload: {
                user_id: '${user?.id || "anonymous"}',
                user_email: '${user?.email || ""}',
                subscription_type: '${user?.subscription?.plan_type || "free"}'
              }
            });
            console.log('👤 User data sent to Voiceflow');
          } catch (e) {
            console.log('⚠️  Could not set user data:', e);
          }
        } else {
          console.log('⏳ Voiceflow not ready yet, retrying in 2 seconds...');
          setTimeout(setVoiceflowUserData, 2000);
        }
      };
      
      // Start trying to set user data after 3 seconds
      setTimeout(setVoiceflowUserData, 3000);
    `,
  };
};