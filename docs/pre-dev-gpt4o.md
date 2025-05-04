# Prompt
```
I've decided to start almost from scratch with another strategy:
- will have only the core base of the dev structure with the containers, setup, and some bare client and server applications inside;
- will bring this base to a new chat and do it like I did with the bills application last weeks, and for that I'll need your help to:

1. generate a PRD.
2. generate some simple wireframes.
3. generate a flow diagram;
4. generate a context state diagram;
5. and finally create a meta=prompt to aply those to the structure I'll show you how it'll begin.

Can we do those? If so, please list to me what more I'd have to provide you to best help you in those tasks. We can do 1 step a time.
```

# Reply (4o may-3-25)

Yes — we can absolutely do that, and I think your new strategy is **very wise**.

You’re essentially resetting to a **clean, guided foundation** with the structure and clarity we used in your bill-splitting project — and that worked *very* well.

---

## ✅ Here’s what I’ll help you build (step by step):

1. **PRD** – Product Requirements Document with all MVP features, personas, UX goals, etc.
2. **Wireframes** – Simple UI sketches to visualize input/output flows
3. **Flow Diagram** – User journey from code creation to clipboard sync
4. **Context State Diagram** – Visual model of session/content state handling
5. **Meta-Prompt** – Final aligned prompt to use in Cursor (or anywhere) for accurate dev continuation

---

## 🔍 To begin — here’s what I’ll need from you (for Step 1: PRD)

Please answer the following **quick checklist**:

### 📝 Functional Vision

* **What core clipboard types** should the MVP support? (plain text, rich text, images, files?)
* **One-way sync or two-way?** Should devices push *and* pull, or only push by default?
* **Does the user need to create a session explicitly**, or can we auto-generate on first send?
* **Should sessions expire after time/inactivity**, or be persisted indefinitely?

### 👤 Usage Expectations

* Personal use only? Or shared with friends/family?
* Should multiple devices/users edit the same session simultaneously?
* Maximum expected users/devices per session?

### 📦 MVP Constraints

* Are we including any authentication? Or totally anonymous?
* Do you want this to work **offline-first**, or online-only for now?
* What device types should be supported? (mobile, desktop, etc.)

### 🎯 Goals

* Is the primary goal **daily personal use**, or **developer portfolio demo**?
* Any deadline or showcase event you’re targeting?

---

Once I get those answers, I’ll draft the PRD right after — clean, structured, and scoped for MVP development.

Let’s take it one strong step at a time. Ready when you are.


# Replying prompt
### 📝 Functional Vision

* **What core clipboard types** should the MVP support? (plain text, rich text, images, files?)
  - Initially, for simplicity and avoid both UI elements complexity and data conversion and storage, we will only need plain text and images, but we should definitely leave it open to markdown text and files;
  - also, initial idea is to have a `session` as a parent of child `item`s, each having that defined type and its type-contexted content, so we can have multiple items under a session, so the user adds one by one and we have a list aside of everything added. Feel free to give an opinion on this, I'm aware this raise a notch of complexity but, if we can't do all the functionality now, it'd be good to know the final intent when planning the data structure.
* **One-way sync or two-way?** Should devices push *and* pull, or only push by default?
  - since 'push and pull' would add way more complexity, let's make it only push and UI error handling in case of conflicts, like we discussed earlier; remembering: if pushing and content was modified since last 'pull', the intial options are either overwrite "up" or "down" (with maybe an optional checkbox to "append all my content" if choosing overwrite "down".
* **Does the user need to create a session explicitly**, or can we auto-generate on first send?
  - to me the most UX-friendly mode would be:
    - if the user didn't come from an url with a valid code, already create a code, and the user automatically created a session, and this should be UI explicit;
    - if the user came from an url with a valid session code, just let it in;
  - feel free to opine and suggest anything else;  
* **Should sessions expire after time/inactivity**, or be persisted indefinitely?
  - yes, they should expire but instead of being permanently deleted they will be "archived" after 1 week (this surely needs to be parameterized someway)- let me know what the best practice for this, i.e. sending sessions+items records/documents to another collection, or just having flags here and there. I have my own thoughts about that considering nosql database, but I want to know what are yours.
  - intially, for MVP reasons, there won't be a way to recover those, but if the app go on developing, we can do something with them; right now it'll be more of a backup/safety net;

### 👤 Usage Expectations

* Personal use only? Or shared with friends/family?
  - if you are meaning about the session, the idea is really targeted for one-person with multiple devices connected, but sure allowed for other users participate in the session - this brings a concept: we only need a device identifier, since we won't use any authentication at first that'll be the "user", although anonymous; if you mean who will use the application, the idea definitely came for personal use only but it'll be public overall, although not going to be announced anywhere besides a few people initially, yet we need at least some kind of human verification (only on abuse/automation-like detection red flags), not too complex, to avoid exploits or abuse by any ways;
* Should multiple devices/users edit the same session simultaneously?
  - not simuntaneously, we actually aren't targettind a team shared utility in here, like a Google Docs does it, we'll hard gate those, like mentioned before, more like a repository of static content, prompting the user whenever there's a conflict when saving it, with those options of "overwrite up or down(with append or not)" mentioned earlier. 
* Maximum expected users/devices per session?
  - we need to introduce the concept behind a "user" here, and we won't use any authentication for now. So what identifies a user is his device, meaning we need to create something unique from the user's request headers - that would be its soft-id in the mongo record. I understand there're a lot of mines in this camp, but right now we don't want auth, so we mix up a lot of data strings from the request headers and try to make it unique, that's it. Not to mention we need to have some human readable, even if a bit weird, "device/user" name for UI/UX. We'll need to go further in this entity/concept, let me know what you think about it by what I said.
  - said that, yes let's limit devices/users by 5 for now, with the option of logout to release seats.


### 📦 MVP Constraints

* Are we including any authentication? Or totally anonymous?
  - Like mentioned before, no auth for now, unique identifier (either for future history or saved sessions, but not for this stage) for a device/user will be as described above, we need to still define that;
* Do you want this to work **offline-first**, or online-only for now?
  - I always want the possibility of offline capabilities, but in this case I think the share goal would only work for local networks, and that would make it way more complex than it should; maybe an offline worker to wait for connection and then commit stuff, but again, too complex for now. If anything can be left open for offline implementation later fine, but if even that is too complex I think we can do online-only.
* What device types should be supported? (mobile, desktop, etc.)
  - desktop and mobile, keeping UI the most simple possible but elegantly so, there are very few elements to be shown and interact to, leave it very responsive but at most 3 breakpoints, preferably 2, being the minimum screen width around 400 (or the most popular minimum nowadays is fine, but around that) and max only enough to not be too wide and broke-feeling.

### 🎯 Goals

* Is the primary goal **daily personal use**, or **developer portfolio demo**?
  - At this personal moment, it'd be 90% developer portfolio demo, but 10% for personal use, since this came from my own needs - although we have multiple ways to share content between devices, they all are always very proprietary and so different between each other (except using like simple http servers, but then always some boring setups and whatnot) that just make you find a way to make it manually, most of the times.
* Any deadline or showcase event you’re targeting?
  - Since my goal was to have this at least already going functional for further tests, tweaking and deploying first time is some cloud services tomorrow, when I began 3-4 days ago, I must say the fastest as possible, since still this week I'd want to update my linkedin with this and other projects, and then go to another PoC/almost-MVP already in talk with the client at least from the middle of the next week. If you can, later at our last step, to make a prediction how many hours overall to be invested into after defining our MVP plan considering a huge help of Cursor+Agent, would be very useful, although I now it can be very variable;

### (Bonus) UI/Visuals considerations
  - The aim still is to be functional before everything else, but the main would be to have a "utiliy looks". maybe even black/white+accent color, and inverse for dark/light toggable themes. dark by default.
  - Simple not equal to ugly or broken, unfortunately more times than not when I use the words simple or minimalist those end up like that. Maybe I should start to name it "elegantly simple and minimalistic".
  - and please, not polluted, or tight, or like it is stacking content on top of each other at all, thy to keep well measured paddings and spacing, using at least default tailwind UI stylling, form elements too, if it's the fastest and simple for now.


---

Feel free to ask for more clarification or details on any response above, and also making another round of questions so we can have it as well defined as possible.
