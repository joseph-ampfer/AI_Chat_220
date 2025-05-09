// Redirect if not logged in
const JSON_BLOB_URL = localStorage.getItem("MyBlobURL");
const USERNAME = localStorage.getItem("username");

const AUTH_TOKEN = localStorage.getItem("authToken");

// if (!JSON_BLOB_URL || !USERNAME) {
//   window.location.replace("login.html");
// }

// Constants
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const PUBLIC_POSTS_URL =
  "https://jsonblob.com/api/jsonBlob/1346491622271148032";
const chatHistory = document.querySelectorAll(".chatHistory");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("userMessage");
const modelDropdown = document.querySelector("#modelSelect");
const modelBtn = document.querySelector("#modelSelect-btn");
const imageInput = document.getElementById("imageUpload");
const imageInputLabel = document.getElementById("imageUploadLabel");
const filePreview = document.getElementById("filePreview");
const chatSection = document.getElementById("chat-section");
const textModelsHTML = `
  <li>
    <a class="dropdown-item model-item" data-model="gemma2-9b-it" href="#" >
      <div >
        <img src="./assets/images/gemini-logo.svg" >
        <span>gemma2-9b-it</span>
      </div>

    </a>
  </li>

  <li>
    <a class="dropdown-item model-item" href="#" data-model="llama-3.3-70b-versatile" >
      <div>
        <img class="meta-logo" src=" ./assets/images/meta-logo.png"   alt="" data-csiid="8ggYaKa4JoH_p84P04W_4Qo_3" data-atf="1">
        <span>llama-3.3-70b-versatile</span>
      </div>
      
    </a>
  </li>
  <li>
    <a class="dropdown-item model-item" href="#" data-model="llama-3.1-8b-instant" >
      <div>
        <img class="meta-logo" src=" ./assets/images/meta-logo.png" alt="" data-csiid="8ggYaKa4JoH_p84P04W_4Qo_3" data-atf="1">
        <span>llama-3.1-8b-instant</span>
      </div>
      
    </a>
  </li>
  <li>
    <a class="dropdown-item model-item" href="#" data-model="llama-guard-3-8b" >
      <div>
        <img class="meta-logo" src=" ./assets/images/meta-logo.png"   alt="" data-csiid="8ggYaKa4JoH_p84P04W_4Qo_3" data-atf="1">
        <span>llama-guard-3-8b</span>
      </div>
      
    </a>
  </li>
  <li>
    <a class="dropdown-item model-item" href="#" data-model="llama3-70b-8192" >
      <div>
        <img class="meta-logo" src=" ./assets/images/meta-logo.png"   alt="" data-csiid="8ggYaKa4JoH_p84P04W_4Qo_3" data-atf="1">
        <span>llama3-70b-8192</span>
      </div>
    </a>
  </li>
  <li class="d-flex justify-content-between">
    <a class="dropdown-item model-item" href="#" data-model="deepseek-r1-distill-llama-70b" >
      <div>
        <img class="deepseek-logo" src="./assets/images/deepseek-logo.png" alt="" >
        <span>deepseek-r1-distill-llama-70b</span>
      </div>
      <img class="reasoning-model" src="./assets/images/brain.svg" title="Reasoning model" >
    </a>
  </li>
  <li>
    <a class="dropdown-item model-item" href="#" data-model="meta-llama/llama-4-maverick-17b-128e-instruct" >
      <div>
        <img class="meta-logo" src=" ./assets/images/meta-logo.png"   alt="" data-csiid="8ggYaKa4JoH_p84P04W_4Qo_3" data-atf="1">
        <span>meta-llama/llama-4-maverick-17b-128e-instruct</span>
      </div>
      <img class="vision-model" src="./assets/images/eye.svg" title="Supports image uploads and analysis">
    </a>
  </li>
  <li>
    <a class="dropdown-item model-item" href="#" data-model="meta-llama/llama-4-scout-17b-16e-instruct" >
      <div>
        <img class="meta-logo" src=" ./assets/images/meta-logo.png"   alt="" data-csiid="8ggYaKa4JoH_p84P04W_4Qo_3" data-atf="1">
        <span>meta-llama/llama-4-scout-17b-16e-instruct</span>
      </div>
      <img class="vision-model" src="./assets/images/eye.svg" title="Supports image uploads and analysis">
    </a>
  </li>
`

const textToImageModelsHTML = `
  <li>
  <a class="dropdown-item model-item" data-model="@cf/black-forest-labs/flux-1-schnell" href="#">
    <div>
      <img class="img-logo" src="./assets/images/blackforestlabs-logo.webp" alt="black-forest-labs logo">
      <span>Flux 1 Schnell</span>
    </div>
  </a>
</li>

<!-- <li>
  <a class="dropdown-item model-item" data-model="@cf/runwayml/stable-diffusion-v1-5-inpainting" href="#">
    <div>
      <img class="img-logo" src="./assets/images/runwayml-logo.png" alt="runwayml logo">
      <span>Stable Diffusion V1.5 Inpainting</span>
    </div>
  </a>
</li> -->

<li>
  <a class="dropdown-item model-item" data-model="@cf/bytedance/stable-diffusion-xl-lightning" href="#">
    <div>
      <img class="img-logo" src="./assets/images/bytedance-logo.png" alt="bytedance logo">
      <span>Stable Diffusion XL Lightning</span>
    </div>
  </a>
</li>

<li>
  <a class="dropdown-item model-item" data-model="@cf/stabilityai/stable-diffusion-xl-base-1.0" href="#">
    <div>
      <img class="img-logo" src="./assets/images/stabilityai-logo.png" alt="stabilityai logo">
      <span>Stable Diffusion XL Base 1.0</span>
    </div>
  </a>
</li>

<li>
  <a class="dropdown-item model-item" data-model="@cf/lykon/dreamshaper-8-lcm" href="#">
    <div>
      <div ></div>
      <span style="margin-left: 2.0rem">Dreamshaper 8 LCM</span>
    </div>
  </a>
</li>

<!-- <li>
  <a class="dropdown-item model-item" data-model="@cf/runwayml/stable-diffusion-v1-5-img2img" href="#">
    <div>
      <img class="img-logo" src="./assets/images/runwayml-logo.png" alt="runwayml logo">
      <span>Stable Diffusion V1.5 Img2Img</span>
    </div>
  </a> -->
</li>
`
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
let isImageChat;
let publicChat

const { Marked } = globalThis.marked;
const { markedHighlight } = globalThis.markedHighlight;

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

// If a chat to view is in query parameter, display it.
// MOVED TO TOP FOR FASTER LOADING
const params = new URLSearchParams(window.location.search);
if (params.get('chatId')) {
  chatMessages.innerHTML = `
  <div class="d-flex justify-content-center align-items-center h-100" >
    <div class="spinner-border " role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>`;
  console.log('chatId: ', params.get('chatId'));
  loadPublicChatById(params.get('chatId'));
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

  // show thumbnail
  filePreview.src = URL.createObjectURL(file);
  filePreview.style.display = 'inline-block';

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
      "Data base64 URL generated (first 50 chars):",
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify({ filename: file.name, contentType: file.type, filesize: file.size })
  });
  
  const { uploadUrl, fileId } = await uploadResponse.json();

  console.log("Upload URL: ", uploadUrl);

  // 2) UPLOAD TO S3;
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { "Content-Type": file.type },
    body: file
  });

  if (!uploadRes.ok) {
    console.error("Upload to S3 failed:", uploadRes.statusText);
  } else {
    console.log("Upload to S3 success, fileId = ", fileId);
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
  imgDiv.innerHTML = `<img src="${imageBase64}" class="img-fluid" style="width: 100%; max-width: 400px;">`;
  

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

  clearQueryString();

  imageInput.classList.add("d-none");
  imageInputLabel.classList.add("d-none");
}
// Attach to new chat button
// document
//   .querySelectorAll("#new-chat-btn")
//   .addEventListener("click", () => newChat());

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
  modelBtn.innerText = "Flux 1 Schnell";
  modelDropdown.innerHTML = textToImageModelsHTML;
  attachModelDropdownListeners();
  model = "@cf/black-forest-labs/flux-1-schnell";

  clearQueryString();
}
// document
//   .querySelector("#img-220-btn")
//   .addEventListener("click", () => newImageChat());

// Helper: Fetch JSON from URL
async function fetchJSON(url) {
  const response = await fetch(url, {headers:{Authorization: `Bearer ${AUTH_TOKEN}`} });
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
    // Parses markdown and highlights with hljs
    messageDiv.innerHTML = marked.parse(message);

    // 1) language labels
    messageDiv.querySelectorAll("pre code").forEach(block => {
      console.log("block: ", block);
      const preBlock = block.parentElement;
      if (!preBlock) return;

      // Ensure we don't duplicate labels
      if (preBlock.querySelector(".code-lang")) return;

      // Extract language name class from hljs
      const langClass = block.className.match(/language-([\w]+)/);
      if (langClass) {
        const languageName = langClass[1];

        // Create language label
        const langLabel = document.createElement("div");
        langLabel.className = "code-lang";
        langLabel.textContent = languageName;

        // Insert label before the code block
        preBlock.insertBefore(langLabel, block);
      }
    });

    // 2) copy buttons
    messageDiv.querySelectorAll("pre code").forEach(code => {
      const preBlock = code.parentElement;

      // Skip creating a new button if one already exists inside the pree
      if (preBlock.querySelector('button')) { return; }

        // Create copy button for code
      const codeCopyBtn = makeCopyBtn(code.innerText, 'copy-code-btn');

      // Insert label before the code block
      preBlock.insertBefore(codeCopyBtn, code);
    });


    // Create copy button for chatContent
    const copyButton = makeCopyBtn(message);

    // Make div for bottom info
    const bottomInfo = document.createElement("div");

    // Make model text
    const modelSpan = document.createElement("span");
    modelSpan.classList.add("blockquote-footer");
    modelSpan.innerText = model2;
    bottomInfo.appendChild(modelSpan);
    bottomInfo.appendChild(copyButton);

    // Append copy button to bottom of response box
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
  chatHistory.forEach(body => body.innerHTML = "");

  // Go through each section, using section as a key for grouped chats
  sections.forEach((section) => {
    if (groupedChats[section].length > 0) {
      // Create header label
      const header = document.createElement("li");
      header.classList.add("list-group-item", "fw-bold", "bg-light");
      header.innerText = section;
      chatHistory.forEach(body => body.appendChild(header.cloneNode(true)));

      // Append chats under the corresponding header
      // Going forwards, bc they come sorted
      for (let i = 0; i < groupedChats[section].length; i++) {
        const { title, _id } = groupedChats[section][i].chat;
        
        // Use helper
        chatHistory.forEach(body => {
          const li = createChatListItem({ title: title, index: groupedChats[section][i].index, chatId: _id });
          body.appendChild(li);
        });
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

async function loadPublicChatById(chatId) {

  chatMessages.innerHTML = "";
  const result = await fetch(`/api/chats/${chatId}/public`, {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });

  if (!result.ok) {
    alert('Error loading chat');
  }

  const chat = await result.json();

  isImageChat = chat.isImageChat;

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

    imageInput.classList.add("d-none");
    imageInputLabel.classList.add("d-none");
  
    conversation = chat.conversation;
    publicChat = chat;
    currentChatId = -2; // Change. viewing public
    currentChatIndex = -2; // Change. Just signaling we're viewing public
 
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
    //hljs.highlightAll();
    console.log("Loaded public chat by chatId:", chatId);
  }
  // document.querySelector(".selectedChat")?.classList.remove("selectedChat");
  // document
  //   .querySelector(`[data-id="${chatId}"]`)
  //   .classList.add("selectedChat");
}

async function loadChatByID(chatId) {

  chatMessages.innerHTML = "";
  const result = await fetch(`/api/chats/${chatId}`, {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });

  if (!result.ok) {
    alert('Error loading chat');
  }

  const chat = await result.json();

  isImageChat = chat.isImageChat;

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

    imageInput.classList.add("d-none");
    imageInputLabel.classList.add("d-none");
  
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
    //hljs.highlightAll();
    clearQueryString();
    console.log("Loaded chat by chatId:", chatId);
  }
  document.querySelector(".selectedChat")?.classList.remove("selectedChat");
  document
    .querySelector(`[data-id="${chatId}"]`)
    .classList.add("selectedChat");
}


// Load conversation history
async function loadChatHistory() {
  try {
    const history = await fetchJSON('/api/chats', {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    //console.log(history);

    // Load chat history (titles) into the aside
    await loadSideBar(history);

    // Optionally load the first chat automatically:
    //newChat();
  } catch (error) {
    console.error("Failed to load chat:", error);
  }
}

function addToSidebar(title, index, chatId, markSelected=false) {
  chatHistory.forEach(body => {
    const li = createChatListItem({title:title, index:index, chatId:chatId, markSelected:markSelected});
    body.prepend(li);
  });
}

function createChatListItem({ title, index, chatId, markSelected}) {
  const li = document.createElement("li");
  li.classList.add("list-group-item", "d-flex", "justify-content-between");
  markSelected && li.classList.add("selectedChat");
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
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({ title: title }),
      });

      if (!res.ok) {
        logInIfNeeded(res);
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
      addToSidebar(title, currentChatIndex, currentChatId, true);
    } else if (currentChatIndex == -2) {
      // Loaded message from home page !!!
      const res = await fetch('/api/chats/continue-public-convo', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({ chat: publicChat }),
      });

      if (!res.ok) {
        logInIfNeeded(res);
        const errorText = await response.text();
        console.log(`Error ${response.status}: ${errorText}`)
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      currentChatId = await res.json();
      console.log('made new chat ', currentChatId);

      // // Set current index to the new chat
      // currentChatIndex = blobData.chats.length - 1;
      currentChatIndex = 5; // ??? CHANGE

      // Add to sidebar
      addToSidebar(publicChat.chat_summary.title, currentChatIndex, currentChatId, true);
    }

    // Set currentModel
    let currentModel = model;

    // Remove file preview
    filePreview.style.display = "none";

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
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Get the chunks of the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      // Create chat box
      const chatContent = document.createElement('div');
      chatContent.classList.add('prose', 'prose-invert', 'max-w-none', 'chat-content');
      chatMessages.appendChild(chatContent); 

      // Automatic scroll with response
      const observer = new MutationObserver(() => {
          chatSection.scrollTop = chatSection.scrollHeight;
      });
      observer.observe(chatContent, { childList: true });

      loader.remove();

      // Process chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the 0's and 1's into text, add to aiText
        const textChunk = decoder.decode(value, { stream: true });
        aiText += textChunk;
        
        // Parse the streamed content and display!!!
        const formattedHTML = marked.parse(aiText);
        chatContent.innerHTML = formattedHTML;

        // Inject CODE language labels after rendering
        document.querySelectorAll("pre code").forEach(block => {
          const preBlock = block.parentElement;
          if (!preBlock) return;

          // Ensure we don't duplicate labels
          if (preBlock.querySelector(".code-lang")) return;

          // Extract language name class from hljs
          const langClass = block.className.match(/language-([\w]+)/);
          if (langClass) {
            const languageName = langClass[1];

            // Create language label
            const langLabel = document.createElement("div");
            langLabel.className = "code-lang";
            langLabel.textContent = languageName;

            // Insert label before the code block
            preBlock.insertBefore(langLabel, block);
          }
        });

      }

      document.querySelectorAll("pre code").forEach(code => {
        const preBlock = code.parentElement;

        // Skip creating a new button if one already exists inside the pree
        if (preBlock.querySelector('button')) { return; }

         // Create copy button for code
        const codeCopyBtn = makeCopyBtn(code.innerText, 'copy-code-btn');

        // Insert label before the code block
        preBlock.insertBefore(codeCopyBtn, code);
      });


      // Create copy button for chatContent
      const copyButton = makeCopyBtn(aiText);

      // Creat TTS button for chatContent
      //const ttsBtn = makeTtsBtn(aiText);

      // Make div for bottom info
      const bottomInfo = document.createElement("div");

      // Make model text
      const modelSpan = document.createElement("span");
      modelSpan.classList.add("blockquote-footer");
      modelSpan.innerText = model;
      bottomInfo.appendChild(modelSpan);
      bottomInfo.appendChild(copyButton);
      //bottomInfo.appendChild(ttsBtn);

      // Append copy button to bottom of response box
      chatContent.appendChild(bottomInfo);

      clearQueryString();
      
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
function makeCopyBtn(toCopy, className='') {
  // Create copy button for chatContent
  const copyButton = document.createElement("button");
  copyButton.title = "Copy";
  copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 17">
            <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
          </svg>`;
  copyButton.classList.add("btn");
  if (className) {copyButton.classList.add(`${className}`)}

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

function makeTtsBtn(message) {
  const ttsBtn = document.createElement('button');
  ttsBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-volume-up" viewBox="0 0 16 16">
    <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
    <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
    <path d="M10.025 8a4.5 4.5 0 0 1-1.318 3.182L8 10.475A3.5 3.5 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.5 4.5 0 0 1 10.025 8M7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11"/>
  </svg>`;
  ttsBtn.classList.add('btn');
  ttsBtn.setAttribute('id', 'ttsBtn');

  const blobBtn = document.createElement('button');
  blobBtn.innerText = "Fetch+Blob";

  const audioEl = document.createElement('audio');
  audioEl.hidden = true;

  // For testing performance... later
  // async function measureStart(fn) {
  //   return new Promise(resolve => {
  //     const t0 = performance.now();
  //     function onPlay() {
  //       const t1 = performance.now();
  //       audioEl.removeEventListener('playing', onPlay);
  //       resolve(t1 - t0);
  //     }
  //     audioEl.addEventListener('playing', onPlay);
  //     fn();
  //   });
  // }

  // Add tts functionality
  ttsBtn.addEventListener('click', async () => {
    //const delta = await measureStart(async() => {
      // point <audio> directly at your chunked endpoint
      audioEl.src = `/api/chats/tts?text=${message}`;  // will produce a chunked response
      audioEl.hidden = false;
      audioEl.play();
    //});
    //console.log(`Stream approach start latency: ${delta.toFixed(1)}ms`);
  });

  // blobBtn.addEventListener('click', async () => {
  //   const delta = await measureStart(async () => {
  //     // Approach B: fetch then blob
  //     const res = await fetch('/api/chats/tts', {
  //       method: 'POST',
  //       headers: { 'Content-Type':'application/json' },
  //       body: JSON.stringify({ text: message })
  //     });
  //     if (!res.ok) {
  //       const u = new SpeechSynthesisUtterance(message);
  //       speechSynthesis.speak(u);
  //       return;
  //     }
  //     const blob = await res.blob();
  //     audioEl.src    = URL.createObjectURL(blob);
  //     audioEl.hidden = false;
  //     await audioEl.play();
  //   });
  //   console.log(`Blob approach start latency:   ${delta.toFixed(1)}ms`);
  // });

  const bundle = document.createElement('span');
  bundle.appendChild(ttsBtn);
  bundle.appendChild(blobBtn);
  return ttsBtn;
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
            Authorization: `Bearer ${AUTH_TOKEN}`
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer AUTH_TOKEN` },
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` },
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
      Authorization: `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({text: message, model: model, fileId: fileId}),
  });

  if (!apiRes.ok) {
    const errorText = await apiRes.text();
    throw new Error(`Error ${apiRes.status}: ${errorText}`);
  }

}

// Post public a chat function!!!! postChat
document
  .querySelector("#postChat")
  .addEventListener("click", async function () {
    if (conversation.length <= 0) {
      alert("No conversation to post", false);
      return;
    }

    if (!confirm('Do you want to make the current snapshot of this chat public?')) {
      return;
    };

    // if (blobData.chats[currentChatIndex].isImageChat) {
    //   alert("Cannot post image chats", false);
    //   return;
    // }

    try {

      console.log('posting chat by id: ', currentChatId);
      // Send request to ai api
      const response = await fetch(`/api/chats/${currentChatId}/post-public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
          isImageChat: isImageChat,
          username: USERNAME,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      console.log(resJson);

      alert("Posted :)");
    } catch (error) {
      console.error("Request failed:", error);
      alert("Problem posting, please try again.");
    }
  });


// Deleting chats
async function deleteChatbyID(chatId) {
  const res = await fetch(`/api/chats/${chatId}/delete`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`
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
      Authorization: `Bearer ${AUTH_TOKEN}`
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
      modelBtn.innerText = this.innerText;
      model = this.dataset.model.trim();
      if (model === "meta-llama/llama-4-maverick-17b-128e-instruct" || model === "meta-llama/llama-4-scout-17b-16e-instruct") {
        imageInput.classList.remove("d-none");
        imageInputLabel.classList.remove("d-none");
      } else {
        imageInput.classList.add("d-none");
        imageInputLabel.classList.add("d-none");
      }
    });
  });
}

// Helper
function logInIfNeeded(res) {
  if (res.status === 401) {
    if (confirm('Please log in to chat. Go to login page?')) {
      window.location.href = '/login';
    }
    return;
  }
}

function updateAppHeight() {
  // Prefer VisualViewport API when available (more accurate on mobile)
  const h = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;

  console.log('updateAppHeight');
  // Set the CSS variable (in px)
  document.documentElement.style.setProperty(
    '--app-height',
    `${h}px`
  );
}

// Update on initial load
updateAppHeight();

// Update whenever the viewport resizes (keyboard open/close, orientation change…)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateAppHeight);
} else {
  window.addEventListener('resize', updateAppHeight);
}

// Utility: replace the current URL with the same path but no query string
function clearQueryString() {
  const cleanUrl = window.location.origin + window.location.pathname;
  history.replaceState({}, document.title, cleanUrl);
}
