const roomEl = document.getElementById("room");
const playerEl = document.getElementById("player");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");
const roomNameEl = document.getElementById("roomName");
const progressText = document.getElementById("progressText");
const tipEl = document.getElementById("tip");

const ROOM_WIDTH = window.innerWidth;
const ROOM_HEIGHT = window.innerHeight;

const player = {
  x: 140,
  y: 220,
  width: 44,
  height: 56,
  speed: 4
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  w: false,
  a: false,
  s: false,
  d: false
};

const infoMap = {
  gong: {
    title: "公天下",
    text: "「大道之行也，天下為公」表示天下屬於公共社會，不屬於某一個家族或私人的利益。"
  },
  xian: {
    title: "選賢與能",
    text: "在大同世界中，社會會選出真正有德行與能力的人來承擔責任。"
  },
  lao: {
    title: "老有所終",
    text: "老人能安享晚年，代表社會願意照顧所有人，而不是只顧自己。"
  },
  you: {
    title: "幼有所長",
    text: "孩子能得到照顧與培養，象徵社會願意對下一代負責。"
  },
  huo: {
    title: "貨不藏私",
    text: "人們不希望物資被浪費，也不把資源只留給自己，反映共享觀念。"
  },
  li: {
    title: "力不為己",
    text: "每個人都願意出力，但不是只為自己，而是為了共同的生活。"
  },
  jia: {
    title: "天下為家",
    text: "到了小康之世，人們更先顧自己的家人與子女，社會從公天下轉向家天下。"
  },
  liyi: {
    title: "禮義制度",
    text: "小康之世仍有秩序，但必須依靠禮義與制度來維持，而不是完全靠人人自發的公心。"
  }
};

const discovered = new Set();

const rooms = {
  datong_start: {
    name: "大同起點",
    roomClass: "datong",
    exits: {
      right: { room: "xiaokang_hall", x: 40, y: 240 },
      bottom: { room: "shared_zone", x: 220, y: 40 }
    },
    zones: [
      {
        className: "zone datong",
        left: 100,
        top: 90,
        width: 760,
        height: 360,
        title: "大同世界",
        text: "天下為公、選賢與能、講信修睦。這裡代表理想中的公共社會。"
      }
    ],
    objects: [
      { type: "npc", id: "gong", x: 260, y: 210, text: "公", label: "公天下" },
      { type: "npc", id: "xian", x: 650, y: 280, text: "賢", label: "選賢與能" },
      { type: "npc", id: "lao", x: 180, y: 360, text: "老", label: "老有所終" },
      { type: "npc", id: "you", x: 760, y: 180, text: "幼", label: "幼有所長" }
    ]
  },

  shared_zone: {
    name: "共享安定區",
    roomClass: "datong",
    exits: {
      top: { room: "datong_start", x: 220, y: ROOM_HEIGHT - 100 },
      right: { room: "ritual_zone", x: 40, y: 260 }
    },
    zones: [
      {
        className: "zone datong",
        left: 130,
        top: 120,
        width: 720,
        height: 320,
        title: "共享安定區",
        text: "貨惡其棄於地也，不必藏於己；力惡其不出於身也，不必為己。"
      }
    ],
    objects: [
      { type: "item", id: "huo", x: 300, y: 260, text: "貨", label: "貨不藏私" },
      { type: "item", id: "li", x: 620, y: 340, text: "力", label: "力不為己" }
    ]
  },

  xiaokang_hall: {
    name: "小康之世",
    roomClass: "xiaokang",
    exits: {
      left: { room: "datong_start", x: ROOM_WIDTH - 100, y: 240 },
      bottom: { room: "ritual_zone", x: 260, y: 40 }
    },
    zones: [
      {
        className: "zone xiaokang",
        left: 130,
        top: 100,
        width: 760,
        height: 360,
        title: "小康之世",
        text: "天下為家，各親其親，各子其子。這裡代表比較接近現實社會的樣貌。"
      }
    ],
    objects: [
      { type: "gate", id: "jia", x: 430, y: 240, text: "天下<br>為家", label: "天下為家" }
    ]
  },

  ritual_zone: {
    name: "禮法秩序區",
    roomClass: "xiaokang",
    exits: {
      top: { room: "xiaokang_hall", x: 260, y: ROOM_HEIGHT - 100 },
      left: { room: "shared_zone", x: ROOM_WIDTH - 100, y: 260 }
    },
    zones: [
      {
        className: "zone xiaokang",
        left: 150,
        top: 130,
        width: 700,
        height: 300,
        title: "禮法秩序區",
        text: "小康仍有秩序，但更多依靠禮義、規範與制度來維持社會。"
      }
    ],
    objects: [
      { type: "gate", id: "liyi", x: 460, y: 250, text: "禮義<br>制度", label: "禮義制度" }
    ]
  }
};

let currentRoomId = "datong_start";
let interactables = [];
let currentNearby = null;
let roomSwitchCooldown = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updatePlayerPosition() {
  playerEl.style.left = `${player.x}px`;
  playerEl.style.top = `${player.y}px`;
}

function updateProgress() {
  progressText.textContent = `已探索：${discovered.size} / ${Object.keys(infoMap).length}`;
}

function showInfo(id) {
  const info = infoMap[id];
  if (!info) return;

  dialogTitle.textContent = info.title;
  dialogText.textContent = info.text;
  discovered.add(id);
  updateProgress();
}

function buildZone(zoneData) {
  const zone = document.createElement("div");
  zone.className = zoneData.className;
  zone.style.left = `${zoneData.left}px`;
  zone.style.top = `${zoneData.top}px`;
  zone.style.width = `${zoneData.width}px`;
  zone.style.height = `${zoneData.height}px`;
  zone.innerHTML = `
    <h3>${zoneData.title}</h3>
    <p>${zoneData.text}</p>
  `;
  return zone;
}

function buildObject(obj) {
  const el = document.createElement("div");
  el.className = `interactable ${obj.type}`;
  el.dataset.id = obj.id;
  el.style.left = `${obj.x}px`;
  el.style.top = `${obj.y}px`;
  el.innerHTML = `
    <div class="label">${obj.label}</div>
    ${obj.text}
  `;
  return el;
}

function renderRoom(roomId) {
  const room = rooms[roomId];
  currentRoomId = roomId;

  roomEl.className = `room ${room.roomClass}`;
  roomEl.innerHTML = "";
  roomNameEl.textContent = `目前房間：${room.name}`;

  room.zones.forEach(zoneData => {
    roomEl.appendChild(buildZone(zoneData));
  });

  room.objects.forEach(obj => {
    roomEl.appendChild(buildObject(obj));
  });

  interactables = room.objects.map(obj => ({
    id: obj.id,
    type: obj.type,
    x: obj.x,
    y: obj.y,
    width: obj.type === "gate" ? 72 : 56,
    height: obj.type === "gate" ? 92 : 56
  }));

  updateNearbyInteractable();
}

function updateNearbyInteractable() {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const item of interactables) {
    const itemCenterX = item.x + item.width / 2;
    const itemCenterY = item.y + item.height / 2;
    const dx = playerCenterX - itemCenterX;
    const dy = playerCenterY - itemCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 95 && distance < nearestDistance) {
      nearest = item;
      nearestDistance = distance;
    }
  }

  currentNearby = nearest;

  if (currentNearby) {
    tipEl.textContent = `按 E 與「${infoMap[currentNearby.id].title}」互動`;
  } else {
    tipEl.textContent = "靠近互動點時按 E";
  }
}

function switchRoom(direction) {
  if (roomSwitchCooldown > 0) return;

  const room = rooms[currentRoomId];
  const exit = room.exits[direction];
  if (!exit) return;

  renderRoom(exit.room);
  player.x = exit.x;
  player.y = exit.y;
  updatePlayerPosition();
  roomSwitchCooldown = 14;
}

function movePlayer() {
  let dx = 0;
  let dy = 0;

  if (keys.ArrowUp || keys.w) dy -= 1;
  if (keys.ArrowDown || keys.s) dy += 1;
  if (keys.ArrowLeft || keys.a) dx -= 1;
  if (keys.ArrowRight || keys.d) dx += 1;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071;
    dy *= 0.7071;
  }

  player.x += dx * player.speed;
  player.y += dy * player.speed;

  if (player.x <= 0) {
    switchRoom("left");
  }
  if (player.x + player.width >= ROOM_WIDTH) {
    switchRoom("right");
  }
  if (player.y <= 0) {
    switchRoom("top");
  }
  if (player.y + player.height >= ROOM_HEIGHT) {
    switchRoom("bottom");
  }

  player.x = clamp(player.x, 0, ROOM_WIDTH - player.width);
  player.y = clamp(player.y, 0, ROOM_HEIGHT - player.height);
}

function gameLoop() {
  movePlayer();
  updatePlayerPosition();
  updateNearbyInteractable();

  if (roomSwitchCooldown > 0) {
    roomSwitchCooldown -= 1;
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (key in keys) {
    keys[key] = true;
  }

  if (key === "e" && currentNearby) {
    showInfo(currentNearby.id);
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (key in keys) {
    keys[key] = false;
  }
});

renderRoom(currentRoomId);
updatePlayerPosition();
updateProgress();
requestAnimationFrame(gameLoop);