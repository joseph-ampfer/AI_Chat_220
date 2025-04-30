// Redirect if not logged in
const JSON_BLOB_URL = localStorage.getItem("MyBlobURL");
const USERNAME = localStorage.getItem("username");
const USERID = '67fe7fe1914b5891b9b5f899'; // CHANGE LATER

const AUTH_TOKEN = localStorage.getItem("authToken");

if (!JSON_BLOB_URL || !USERNAME) {
  window.location.replace("login.html");
}

// Constants
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const PUBLIC_POSTS_URL =
  "https://jsonblob.com/api/jsonBlob/1346491622271148032";
const chatHistory = document.querySelector("#chatHistory");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("userMessage");
const modelDropdown = document.querySelector("#modelSelect");
const modelBtn = document.querySelector("#modelSelect-btn");
const imageInput = document.getElementById("imageUpload");
const chatSection = document.getElementById("chat-section");
const textModelsHTML = `
  <li><a class="dropdown-item" href="#" >gemma2-9b-it</a></li>
  
  <li><a class="dropdown-item" href="#" >llama-3.3-70b-versatile</a></li>
  <li><a class="dropdown-item" href="#" >llama-3.1-8b-instant</a></li>
  <li><a class="dropdown-item" href="#" >llama-guard-3-8b</a></li>
  <li><a class="dropdown-item" href="#" >llama3-70b-8192</a></li>

  <li><a class="dropdown-item" href="#" >deepseek-r1-distill-llama-70b</a></li>
  <li><a class="dropdown-item" href="#" >meta-llama/llama-4-maverick-17b-128e-instruct</a></li>
  <li><a class="dropdown-item" href="#" >meta-llama/llama-4-scout-17b-16e-instruct</a></li>`
const textToImageModelsHTML = `
  <li><a class="dropdown-item" href="#" >@cf/black-forest-labs/flux-1-schnell</a></li>
  
  <li><a class="dropdown-item" href="#" >@cf/runwayml/stable-diffusion-v1-5-inpainting</a></li>
  <li><a class="dropdown-item" href="#" >@cf/bytedance/stable-diffusion-xl-lightning</a></li>
  <li><a class="dropdown-item" href="#" >@cf/lykon/dreamshaper-8-lcm</a></li>
  <li><a class="dropdown-item" href="#" >@cf/stabilityai/stable-diffusion-xl-base-1.0</a></li>
  <li><a class="dropdown-item" href="#" >@cf/runwayml/stable-diffusion-v1-5-img2img</a></li>`
const textToImageModels = ['@cf/black-forest-labs/flux-1-schnell', '@cf/runwayml/stable-diffusion-v1-5-inpainting', '@cf/bytedance/stable-diffusion-xl-lightning', '@cf/lykon/dreamshaper-8-lcm', '@cf/stabilityai/stable-diffusion-xl-base-1.0', '@cf/runwayml/stable-diffusion-v1-5-img2img'];

// Global Variables
let conversation = [];
let blobData = {};
let currentChatIndex = -1;
let model = modelBtn.innerText.trim();
let uploadedImageBase64 = null;
let modelTracking = {};
let selectedPublicChat = {};
let chatId;
let currentChatId;
let uploadedFileId;

// If a chat to view is in session storage, display it.
// MOVED TO TOP FOR FASTER LOADING
let publicChatConvo = sessionStorage.getItem("selectedPublicChat");
console.log(publicChatConvo);
if (publicChatConvo) {
  chatMessages.innerHTML = `<div class="spinner-border " role="status">
            <span class="visually-hidden">Loading...</span>
          </div>`;
  loadChatByChat(JSON.parse(publicChatConvo));
}

// Automatic scroll with response
const observer = new MutationObserver(() => {
  //chatSection.scrollTop = chatSection.scrollHeight; // Scroll to bottom
});
observer.observe(chatSection, { childList: true, subtree: true });

// Handle Image Upload
// Global variable to keep track of the last file name
let lastFileName = "";
// LISTEN FOR FILE SELECTED
imageInput.addEventListener("change", async function (event) {
  console.log("Image input change event triggered.");

  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected.");
    return;
  }

  // Log detailed information about the file
  console.log(
    "File selected:",
    file.name,
    "Size:",
    file.size,
    "Type:",
    file.type,
    "Last Modified:",
    new Date(file.lastModified).toLocaleString()
  );

  // Check if the same file is being selected again
  if (lastFileName === file.name) {
    console.log("The same file has been selected as before.");
  } else {
    console.log("A new file has been selected.");
  }
  lastFileName = file.name;

  const reader = new FileReader();

  reader.onload = function () {
    // The result is a Data URL that includes the base64 string
    const dataURL = reader.result;
    console.log(
      "Data URL generated (first 50 chars):",
      dataURL.substring(0, 50) + "..."
    );
    uploadedImageBase64 = dataURL;
    //displayImagePreview(dataURL);
  };

  // Read the file as a Data URL (base64 encoded)
  reader.readAsDataURL(file);

  // 1) GET UPLOAD URL
  const uploadResponse = await fetch('/api/files/getPostUrl', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, filesize: file.size })
  });
  
  const { uploadUrl, fileId } = await uploadResponse.json();

  // 2) UPLOAD TO S3;
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { "Content-Type": file.type },
    body: file
  });

  if (!uploadRes.ok) {
    console.error("Upload failed:", uploadRes.statusText);
  } else {
    console.log("Upload success, fileId = ", fileId);
    uploadedFileId = fileId;
  }
});

// Display Image Preview in Chat
function displayImagePreview(imageBase64) {
  const imgDiv = document.createElement("div");
  imgDiv.classList.add("text-end", "mb-3");
  imgDiv.innerHTML = `<img src="${imageBase64}" class="img-thumbnail" >`;
  chatMessages.appendChild(imgDiv);
}

// Display generated image
function displayGeneratedImage(imageBase64, model) {
  const imgDiv = document.createElement("div");
  imgDiv.classList.add("mb-3", "mx-auto");
  imgDiv.innerHTML = `<img src="${imageBase64}" class="img-fluid" style="max-width: 400px;">`;
  

  // Make div for model info
  const bottomInfo = document.createElement("div");

  // Make model text
  const modelSpan = document.createElement("span");
  modelSpan.classList.add("blockquote-footer");
  modelSpan.innerText = model;
  bottomInfo.appendChild(modelSpan);
  imgDiv.appendChild(bottomInfo);

  chatMessages.appendChild(imgDiv);
}

// Model select functionality model-select modelDropdown
attachModelDropdownListeners();

// New chat function
function newChat() {
  // Clear screen
  chatMessages.innerHTML = `<div class="d-flex align-items-center justify-content-center text-center h-100" role="status">
              <h2 class="">Hello! How can I assist you today?</h2>
            </div>`;
  // Clear local conversation
  conversation = [];
  // Set current index to a temporary value indicating "new unsaved chat"
  currentChatIndex = -1;
  // Remove selected chat highlight
  document.querySelector(".selectedChat")?.classList.remove("selectedChat");
  // Make dropdown and model correct
  if (textToImageModels.includes(model)) {
    modelBtn.innerText = "gemma2-9b-it";
    model = "gemma2-9b-it";
  } else {
    modelBtn.innerText = model;
  }
  modelDropdown.innerHTML = textModelsHTML;
  //model = "gemma2-9b-it";
  // Model select
  attachModelDropdownListeners();
}
// Attach to new chat button
document
  .querySelector("#new-chat-btn")
  .addEventListener("click", () => newChat());

// New image generation chat function
function newImageChat() {
  // Clear screen
  chatMessages.innerHTML = `<div class="d-flex align-items-center justify-content-center text-center h-100" role="status">
              <h2 class="">Turning text into reality.</h2>
            </div>`;
  // Clear local conversation
  conversation = [];
  // Set current index to a temporary value indicating "new unsaved chat"
  currentChatIndex = -1;
  // Remove selected chat highlight
  document.querySelector(".selectedChat")?.classList.remove("selectedChat");
  modelBtn.innerText = "@cf/black-forest-labs/flux-1-schnell";
  modelDropdown.innerHTML = textToImageModelsHTML;
  attachModelDropdownListeners();
  model = "@cf/black-forest-labs/flux-1-schnell";
}
document
  .querySelector("#img-220-btn")
  .addEventListener("click", () => newImageChat());

// Helper: Fetch JSON from URL
async function fetchJSON(url) {
  const response = await fetch(url, {headers:{Authorization: USERID} });
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return response.json();
}

// Helper: Update JSON Blob with blobData directly
async function updateJSONBlob(url, data) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Update JSON Blob failed: ${response.statusText}`);
  }
}

// Helper: Display message in chat
function appendMessage(message, isUser = true, model2 = "Unkown model") {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("mb-3");
  if (isUser) {
    messageDiv.innerHTML = `<div class="bg-primary user-message" >${message}</div>`;
  } else {
    messageDiv.innerHTML = marked.parse(message);

    // Make copy button
    const copyButton = makeCopyBtn(message);

    // Make div
    const bottomInfo = document.createElement("div");

    // Make model text
    const modelSpan = document.createElement("span");
    modelSpan.classList.add("blockquote-footer");
    modelSpan.innerText = model2;
    bottomInfo.appendChild(modelSpan);
    bottomInfo.appendChild(copyButton);

    messageDiv.appendChild(bottomInfo);
  }
  chatMessages.appendChild(messageDiv);
}

// Load chats for side bar
async function loadSideBar(history) {
  // Group the chats, get result
  const groupedChats = groupChatsByDate(history);

  // Order in which we want to display groups
  const sections = ["Today", "Yesterday", "Previous 7 Days", "Older"];

  // Remove placeholder
  chatHistory.innerHTML = "";

  // Go through each section, using section as a key for grouped chats
  sections.forEach((section) => {
    if (groupedChats[section].length > 0) {
      // Create header label
      const header = document.createElement("li");
      header.classList.add("list-group-item", "fw-bold", "bg-light");
      header.innerText = section;
      chatHistory.appendChild(header);

      // Append chats under the corresponding header
      // Going forwards, bc they come sorted
      for (let i = 0; i < groupedChats[section].length; i++) {
        const { title, _id } = groupedChats[section][i].chat;
        
        // Use helper
        const li = createChatListItem({title:title, index:groupedChats[section][i].index, chatId:_id})
        chatHistory.appendChild(li);
      }
      
    }
  });
}
// Close the options popup when clicking outside
document.addEventListener("click", function (event) {
  document.querySelectorAll(".chat-options.show").forEach((popup) => {
    // The parent of the chatOptions is the wrapper that contains both the button and the options.
    // If the click target isn't within that wrapper, hide the popup.
    if (!popup.parentElement.contains(event.target)) {
      popup.classList.remove("show");
    }
  });
});

// Grouping chats by date to get to load sidebar
function groupChatsByDate(chats) {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).getTime();
  const yesterdayStart = todayStart - 86400000; // 1 day before start
  const weekStart = todayStart - 7 * 86400000; // 7 days before start

  const grouped = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  chats.forEach((chat, index) => {
    const chatTime = new Date(chat.updatedAt).getTime() || 0;

    let group;
    if (chatTime >= todayStart) {
      group = "Today";
    } else if (chatTime >= yesterdayStart) {
      group = "Yesterday";
    } else if (chatTime >= weekStart) {
      group = "Previous 7 Days";
    } else {
      group = "Older";
    }

    grouped[group].push({ chat, index }); // Keep the original index
  });

  return grouped;
}

async function loadChatByID(chatId) {

  chatMessages.innerHTML = "";
  const result = await fetch(`/api/chats/${chatId}`, {
    headers: {
      Authorization: USERID
    }
  });

  if (!result.ok) {
    alert('Error loading chat');
  }

  const chat = await result.json();

  if (chat && chat.conversation) {
    // Check if image generator chat, change model select
    if (chat.isImageChat) {
      modelBtn.innerText = "@cf/black-forest-labs/flux-1-schnell";
      modelDropdown.innerHTML = textToImageModelsHTML;
      model = "@cf/black-forest-labs/flux-1-schnell";
      imageModel = true;
      attachModelDropdownListeners();
    } else {
      modelBtn.innerText = "gemma2-9b-it";
      modelDropdown.innerHTML = textModelsHTML;
      attachModelDropdownListeners();
      model = "gemma2-9b-it";
    }
  
    conversation = chat.conversation;
    currentChatId = chatId;
    currentChatIndex = 5; // Change. Just signaling we're in an existing text chat
 
    // Display chat history with append message
    for (let i = 0; i < conversation.length; i++) {
      // If content is an array, assume image formatting and display the image
      if (Array.isArray(conversation[i].content)) {
        if (conversation[i].content.length > 1) {
          if (conversation[i].role == "user") {
            displayImagePreview(conversation[i].content[1]?.image_url?.url);
          } else {
            displayGeneratedImage(conversation[i].content[1]?.image_url?.url, conversation[i].model);
          }
        }
        // Ai gen images have no text in 'assistant' array, check before appending
        if (conversation[i].content[0].text != "") {
          appendMessage(conversation[i].content[0].text);
        }
      } else {
        appendMessage(
          conversation[i].content,
          conversation[i].role == "user",
          conversation[i].model
        );
      }
    }
    //currentChatIndex = index;
    hljs.highlightAll();
    console.log("Loaded chat by chatId:", chatId);
  }
  document.querySelector(".selectedChat")?.classList.remove("selectedChat");
  document
    .querySelector(`[data-id="${chatId}"]`)
    .classList.add("selectedChat");
}

// function loadChatByIndex(index) {
//   chatMessages.innerHTML = "";
//   const selectedChat = blobData[index];

//   if (selectedChat && selectedChat.conversation) {
//     // Check if image generator chat, change model select
//     if (selectedChat.isImageChat) {
//       modelBtn.innerText = "Image";
//       modelDropdown.innerHTML = "";
//       model = "image";
//     } else {
//       modelBtn.innerText = "gemma2-9b-it";
//       modelDropdown.innerHTML = textModelsHTML;
//       attachModelDropdownListeners();
//       model = "gemma2-9b-it";
//     }

//     conversation = selectedChat.conversation;
//     modelTracking = selectedChat.modelTracking || {}; // Ensure modelTracking is an object

//     // Display chat history with append message
//     for (let i = 0; i < conversation.length; i++) {
//       // If content is an array, assume image formatting and display the image
//       if (Array.isArray(conversation[i].content)) {
//         if (conversation[i].content.length > 1) {
//           if (conversation[i].role == "user") {
//             displayImagePreview(conversation[i].content[1]?.image_url.url);
//           } else {
//             displayGeneratedImage(conversation[i].content[1]?.image_url.url);
//           }
//         }
//         appendMessage(conversation[i].content[0].text);
//       } else {
//         appendMessage(
//           conversation[i].content,
//           conversation[i].role == "user",
//           modelTracking[i]
//         );
//       }
//     }
//     currentChatIndex = index;
//     hljs.highlightAll();
//     console.log("Loaded chat by index:", currentChatIndex);
//     console.log(conversation);
//   }
//   document.querySelector(".selectedChat")?.classList.remove("selectedChat");
//   document
//     .querySelector(`[data-index="${currentChatIndex}"]`)
//     .classList.add("selectedChat");
// }

function loadChatByChat(chat) {
  chatMessages.innerHTML = "";
  selectedPublicChat = chat;
  const selectedChat = chat;

  if (selectedChat && selectedChat.conversation) {
    // Check if image generator chat, change model select
    if (selectedChat.isImageChat) {
      modelBtn.innerText = "@cf/black-forest-labs/flux-1-schnell";
      modelDropdown.innerHTML = "";
      model = "@cf/black-forest-labs/flux-1-schnell";
    } else {
      modelBtn.innerText = "gemma2-9b-it";
      modelDropdown.innerHTML = textModelsHTML;
      model = "gemma2-9b-it";
    }

    conversation = selectedChat.conversation;
    modelTracking = selectedChat.modelTracking || {}; // Ensure modelTracking is an object

    // Display chat history with append message
    for (let i = 0; i < conversation.length; i++) {
      // If content is an array, assume image formatting and display the image
      if (Array.isArray(conversation[i].content)) {
        if (conversation[i].content.length > 1) {
          if (conversation[i].role == "user") {
            displayImagePreview(conversation[i].content[1]?.image_url.url);
          } else {
            displayGeneratedImage(conversation[i].content[1]?.image_url.url);
          }
        }
        appendMessage(conversation[i].content[0].text);
      } else {
        appendMessage(
          conversation[i].content,
          conversation[i].role == "user",
          modelTracking[i]
        );
      }
    }
    currentChatIndex = -2;
    hljs.highlightAll();
    console.log("Loaded chat by chat:", currentChatIndex);
    console.log(conversation);
  }
  // Remove selected chat from session storage
  sessionStorage.removeItem("selectedPublicChat");
  // document.querySelector('.selectedChat')?.classList.remove('selectedChat');
  // document.querySelector(`[data-index="${currentChatIndex}"]`).classList.add('selectedChat');
}

// Load conversation history from jsonBlob
async function loadChatHistory() {
  try {
    const history = await fetchJSON('/api/chats');
    //console.log(history);

    // Load chat history (titles) into the aside
    await loadSideBar(history);

    // Optionally load the first chat automatically:
    //newChat();
  } catch (error) {
    console.error("Failed to load chat:", error);
  }
}

function addToSidebar(title, index, chatId) {
  const li = createChatListItem({title:title, index:index, chatId:chatId});
  chatHistory.prepend(li);
}

function createChatListItem({ title, index, chatId }) {
  const li = document.createElement("li");
  li.classList.add("list-group-item", "d-flex", "justify-content-between");
  li.dataset.index = index;
  li.dataset.id    = chatId;

  // Title
  const titleSpan = document.createElement("div");
  titleSpan.classList.add("chat-title");
  titleSpan.innerText = title;
  li.appendChild(titleSpan);

  // Options wrapper
  const wrapper = document.createElement("div");
  wrapper.classList.add("chat-options-wrapper");
  li.appendChild(wrapper);

  const threeDots = document.createElement("button");
  threeDots.classList.add("three-dots-btn");
  threeDots.innerHTML = `<i class="bi bi-three-dots"></i>`;
  wrapper.appendChild(threeDots);

  const chatOptions = document.createElement("div");
  chatOptions.classList.add("chat-options");
  wrapper.appendChild(chatOptions);

  const renameBtn = document.createElement("button");
  renameBtn.classList.add("rename-chat", "btn", "d-flex", "justify-content-between", "text-end");
  renameBtn.innerHTML = `<i class="bi bi-pencil me-3"></i><span>Rename</span>`;
  chatOptions.appendChild(renameBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-chat", "text-danger", "btn", "text-end");
  deleteBtn.innerHTML = `<i class="bi bi-trash3 me-3"></i><span>Delete</span>`;
  chatOptions.appendChild(deleteBtn);

  // Event listeners
  
  // When clicking the li (outside of the options), load the chat.
  li.addEventListener("click", () => loadChatByID(chatId));
  
  // Three dots button toggles the popup
  threeDots.addEventListener("click", function (event) {
    event.stopPropagation();
    chatOptions.classList.toggle("show");
  });

  // Delete button event listener
  deleteBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    li.remove(); // Remove from UI
    deleteChatbyID(chatId);  // Remove from DB
  });

  // Rename button event listener
  renameBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    chatOptions.classList.remove("show"); // Hide popup

    // Prompt user for new chat title. You can also create an inline input instead.
    const newTitle = prompt("Enter new chat title:", titleSpan.innerText);
    if (newTitle !== null && newTitle.trim() !== "") {
      titleSpan.innerText = newTitle;
      renameChatByID(chatId, newTitle);
    }
  });

  return li;
}


// Send user message and get bot response
async function sendMessageToAI(message) {
  try {
    // Check if we're in a NEW unsaved chat
    if (currentChatIndex === -1) {
      chatMessages.innerHTML = "";
      // Create new chat entry with the first message as title
      const title = message.split(" ").slice(0, 5).join(" ");

      // Create new chat and get chatId
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: USERID,
        },
        body: JSON.stringify({ title: title }),
      });

      if (!res.ok) {
        const errorText = await response.text();
        console.log(`Error ${response.status}: ${errorText}`)
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      currentChatId = await res.json();
      console.log(currentChatId);

      // // Set current index to the new chat
      // currentChatIndex = blobData.chats.length - 1;
      currentChatIndex = 5; // ??? CHANGE

      // Add to sidebar
      addToSidebar(title, currentChatIndex, currentChatId);
    } else if (currentChatIndex == -2) {
      // Loaded message from home page !!!
      // Save public chat to end of your chats
      blobData.chats.push(selectedPublicChat);

      // Set current index to the new chat
      currentChatIndex = blobData.chats.length - 1;

      // Add to sidebar
      let li = document.createElement("li");
      li.classList.add("list-group-item", "selectedChat");
      li.innerText = selectedPublicChat.title;
      let newIndex = currentChatIndex;
      li.dataset.index = newIndex;
      li.addEventListener("click", () => loadChatByIndex(newIndex));
      document.querySelector("#chatHistory").prepend(li);
    }

    let currentModel = model;

    // Check if using vision model
    let messageContent;
    if (currentModel == "meta-llama/llama-4-maverick-17b-128e-instruct" || currentModel == "meta-llama/llama-4-scout-17b-16e-instruct") {
      messageContent = [{ type: "text", text: message }];
      if (uploadedImageBase64) {
        displayImagePreview(uploadedImageBase64);
        // Only one image per chat
        //imageInput.classList.add("d-none");
      }
    } else {
      messageContent = message;
    }

    // Display message
    appendMessage(message); // Display user message
    
    chatSection.scrollTop = chatSection.scrollHeight; // Scroll to bottom

    // Add message to conversation
    conversation.push({ role: "user", content: messageContent });

    if (textToImageModels.includes(model)) {
      await generateImage(message);
    } else {
      // Display loader
      const loader = document.createElement('p');
      loader.classList.add('placeholder-glow');
      const sp = document.createElement('span');
      sp.classList.add('placeholder', 'text');
      sp.style.width = "15%";
      sp.innerText = "Loading...";
      loader.appendChild(sp);
      chatMessages.appendChild(loader);

      const body = {
        text: message,
        model: currentModel
      };
      if (uploadedFileId) { body.fileId = uploadedFileId };
      
      // Send request to ai api
      const response = await fetch(`api/chats/${currentChatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: USERID,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const botMessage = await response.text() ?? "No response.";

      appendMessage(botMessage, false, currentModel); // Display bot response

      loader.remove();

      hljs.highlightAll(); // Highlight code 
    }
  } catch (error) {
    console.error("Request failed:", error);
    appendMessage("🚫 Oops! Something went wrong. Please try again.", false);
  } finally {
    uploadedImageBase64 = null;
    imageInput.value = "";
    uploadedFileId = null;
    //chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
  }
}

// Helper: make copy button
function makeCopyBtn(toCopy) {
  // Create copy button for chatContent
  const copyButton = document.createElement("button");
  copyButton.title = "Copy";
  copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 17">
            <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
          </svg>`;
  copyButton.classList.add("btn");

  // Add copy functionality
  copyButton.addEventListener("click", function () {
    //const text = botMessage;
    navigator.clipboard
      .writeText(toCopy)
      .then(() => {
        // Mark done and then revert back
        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/>
                </svg>`;
        setTimeout(() => {
          copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 17">
                    <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                  </svg>`;
        }, 1000);
      })
      .catch((err) => console.error("Failed to copy: ", err));
  });
  return copyButton;
}

// Handle enter press in textarea
messageInput.addEventListener("keypress", function (event) {
  if (event.key == "Enter" && !event.shiftKey) {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
      sendMessageToAI(message);
      messageInput.value = ""; // Clear input
    }
  }
});

// Handle form submission (pressing submit, may change this later)
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message) {
    sendMessageToAI(message);
    messageInput.value = ""; // Clear input
  }
});

// Load the chat on page load
loadChatHistory();

// Audio transcription!!!!
let isRecording = false;

// Define icon templates
const micIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
          <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"/>
          <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3"/>
        </svg>
      `;

const stopIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-stop-circle" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5z"/>
        </svg>
      `;

let audioStream;
let mediaRecorder;
let recordedChunks = [];
async function startRecording() {
  try {
    // Request access to the microphone
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // success!
    } catch (err) {
      console.error("Permission denied or no device:", err);
    }
    // Create a MediaRecorder instance
    mediaRecorder = new MediaRecorder(audioStream);

    // When data is available, push it to recordedChunks
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });

    // When recording stops, create a blob from the chunks and trigger a download
    mediaRecorder.addEventListener("stop", async () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("temperature", 0);
      formData.append("response_format", "json");
      formData.append("language", "en");

      const response = await fetch('/api/chats/transcriptions',
        {
          method: "POST",
          headers: {
            Authorization: USERID,
            // Let the browser set the correct Content-Type header for FormData.
          },
          body: formData,
        }
      );
      const result = await response.json();
      console.log("Transcription result:", result);
      console.log(result.text);
      sendMessageToAI(result.text);

      recordedChunks = [];
    });

    mediaRecorder.start();
    console.log("Recording started");
  } catch (err) {
    console.error("Error accessing the microphone", err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    audioStream.getTracks().forEach((track) => track.stop());
    console.log("Recording stopped and microphone released");
  }
}

function toggleRecording() {
  const toggleBtn = document.getElementById("toggle-recording");
  if (isRecording) {
    stopRecording();
    toggleBtn.classList.remove("btn-danger");
    toggleBtn.classList.add("btn-primary");
    toggleBtn.innerHTML = micIcon; // Show mic icon
  } else {
    startRecording();
    toggleBtn.classList.remove("btn-primary");
    toggleBtn.classList.add("btn-danger");
    toggleBtn.innerHTML = stopIcon; // Show stop icon
  }
  isRecording = !isRecording;
}

// Helper function to convert a blob to a Base64 string
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// image generator
async function generateImage(message) {
  // Display placehoder the image in an <img> tag
  const placeholder = document.createElement("div");
  placeholder.classList.add(
    "bg-secondary",
    "rounded",
    "d-flex",
    "align-items-center",
    "justify-content-center"
  );
  placeholder.style.width = "400px";
  placeholder.style.height = "400px";
  placeholder.style.margin = "";
  placeholder.innerHTML = `
          <div class="spinner-border text-light " role="status">
            <span class="visually-hidden">Loading...</span>
          </div>`;

  chatMessages.appendChild(placeholder);
  chatSection.scrollTop = chatSection.scrollHeight; // Scroll to bottom

  console.log(model);
  // Generate image from Cloudflare
  const response = await fetch(`https://imagegen.jampfer.workers.dev/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: message, model: model }),
  });

  if (!response.ok) {
    placeholder.remove();
    console.log("Error fetching image", response);
    throw new Error("Error fetching image:", response.statusText);
  }

  // Convert the binary response to a blob
  const blob = await response.blob();

  // // Create an object URL for the image
  const imageUrl = URL.createObjectURL(blob);

  // Display the image in an <img> tag
  // const img = document.createElement("img");
  // img.classList.add("img-fluid");
  // img.src = imageUrl;
  // img.alt = "Generated AI image";
  // placeholder.innerHTML = "";
  // placeholder.appendChild(img);
  placeholder.remove();

  displayGeneratedImage(imageUrl, model);

  // Convert the blob to a Base64 string
  const base64data = await blobToBase64(blob);

  // Get presigned PUT
  // 1) GET UPLOAD URL
  const uploadResponse = await fetch('/api/files/getPostUrl', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: "Generated_image.png", contentType: blob.type, filesize: blob.size })
  });
  
  const { uploadUrl, fileId } = await uploadResponse.json();

  // 2) UPLOAD TO S3;
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { "Content-Type": blob.type },
    body: blob
  });

  if (!uploadRes.ok) {
    console.error("Upload failed:", uploadRes.statusText);
  } else {
    console.log("Upload success, fileId = ", fileId);
    uploadedFileId = fileId;
  }

  // Call api and store messages in Mongodb
  const apiRes = await fetch(`api/chats/${currentChatId}/imageGen`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: USERID,
    },
    body: JSON.stringify({text: message, model: model, fileId: fileId}),
  });

  if (!apiRes.ok) {
    const errorText = await apiRes.text();
    throw new Error(`Error ${apiRes.status}: ${errorText}`);
  }

}

// Post a chat function!!!! postChat
document
  .querySelector("#postChat")
  .addEventListener("click", async function () {
    if (conversation.length <= 0) {
      alert("No conversation to post", false);
      return;
    }

    if (blobData.chats[currentChatIndex].isImageChat) {
      alert("Cannot post image chats", false);
      return;
    }

    try {

      // Send request to ai api
      const response = await fetch('/api/summarize-chat', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: USERID,
        },
        body: JSON.stringify({
          messages: conversation,
          model: 'gemma2-9b-it',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      // console.log(resJson);
      // const botMessage =
      //   resJson.choices?.[0]?.message?.content ?? "No response.";
      const parsed = JSON.parse(resJson);

      let newPostData = {
        username: USERNAME,
        chat_summary: parsed.chat_summary,
        chat: blobData.chats[currentChatIndex],
      };

      let publicBlob = await fetchJSON(PUBLIC_POSTS_URL);
      console.log(publicBlob);
      publicBlob.push(newPostData);

      await updateJSONBlob(PUBLIC_POSTS_URL, publicBlob);

      alert("Posted :)");
    } catch (error) {
      console.error("Request failed:", error);
      alert("Problem posting, please try again.");
    }
  });

// // Deleting chats
// async function deleteChatbyIndex(index) {
//   // Splice out indexed chat
//   blobData.chats.splice(index, 1);
//   // Send to jsonblob
//   updateJSONBlob(JSON_BLOB_URL, blobData);
// }

// Deleting chats
async function deleteChatbyID(chatId) {
  const res = await fetch(`/api/chats/${chatId}/delete`, {
    method: 'DELETE',
    headers: {
      Authorization: USERID
    }
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.text}`);
  }
  if (currentChatId == chatId) {
    newChat();
  }
  console.log('chat deleted');
}

// Renaming chats
async function renameChatByID(chatId, title) {
  const res = await fetch(`/api/chats/${chatId}/rename`, {
    method: 'PATCH',
    headers: {
      'Content-type': 'application/json',
      Authorization: USERID
    },
    body: JSON.stringify({ title: title }),
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.text}`);
  }

  console.log('chat renamed');
}

// SELECTING A MODEL LISTENERS
function attachModelDropdownListeners() {
  document.querySelectorAll("#modelSelect li a").forEach((e) => {
    e.addEventListener("click", function () {
      modelBtn.innerText = e.innerText;
      model = e.innerText.trim();
      if (model === "meta-llama/llama-4-maverick-17b-128e-instruct" || model === "meta-llama/llama-4-scout-17b-16e-instruct") {
        imageInput.classList.remove("d-none");
      } else {
        imageInput.classList.add("d-none");
      }
    });
  });
}