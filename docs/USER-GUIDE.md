# CleanMyTV user guide

A step-by-step guide for TV owners. Written against **v0.1** — screens change, the ideas don't. Every screenshot in the README is labelled with the version it was taken from; expect this guide's pictures to be added the same way as the app settles.

If you are comfortable with ADB, package names and rollback semantics, the [README](../README.md) is the short version. This guide is for everyone else: it walks each step at TV-owner pace, says what you will see, and has a "if it didn't work" box for the common failures.

---

## 1. Before you start: what this app does (and does not do)

**In one sentence:** it turns off the apps on your Android TV that you don't want, puts a clean, calm home screen in their place, and can put everything back the way it was.

Three promises worth knowing before anything else:

- **Nothing is uninstalled.** Apps are switched off *for your user* (`pm disable-user`), not removed from the TV. They take no space on screen, and they come back with one click of **Restore**.
- **It only talks to your TV.** The app connects over your home Wi-Fi to the TV's debugging port (5555). No account, no cloud, no telemetry.
- **There is always a way back.** Before the first cleanup the app writes a restore record — which packages were on, which launcher Home pointed at — and Restore replays it exactly. [Chapter 7](#7-safety-and-rollback) covers this in full.

---

## 2. Prepare the TV (5 minutes, one-time)

You need to switch on the TV's developer options, the same ones phone apps use. Nothing you do here can break the TV; the switch can be turned off again at any time.

1. On the TV remote: **Settings → Device Preferences → About** (on some Google TVs: **Settings → System → About**).
2. Move down to **Build** (or **Android TV OS build**) and press OK on it **seven times**. After the third or so a small counter appears; at seven the TV says *You are now a developer* (or similar).
3. Go back one screen → **Developer options** → turn on **USB debugging**. If your TV also lists **Network debugging** or **ADB debugging**, turn that on too — that is the one this app uses.
4. Leave the TV on and awake. It must stay on the same Wi-Fi as your computer.

> **If it didn't work**
>
> - *No Developer options in the menu.* Some TVs hide it under a different Settings layout — look for **System → Advanced**. A few budget models need the TV signed into a Google account first.
> - *The counter never appears.* You are pressing a different row — it must be the **Build number** itself, not the Android version above it.

---

## 3. Connect (the Allow prompt)

1. Open CleanMyTV on your computer. The **Setup** step checks the network and lists TVs it can see.
2. Pick your TV. The app connects and the TV shows an **Allow USB debugging?** prompt with your computer's identity on it.
3. On the TV, choose **Allow**, and tick **Always allow from this computer** to skip the question next time.

Google TVs that only offer *Wireless debugging* get a pairing form instead — the app walks you through the TV's Wireless-debugging screen and the six-digit code it shows.

> **If it didn't work**
>
> - *The TV isn't listed.* The TV and the computer must be on the same Wi-Fi — and on the *same band* if your router splits 2.4 GHz and 5 GHz into separate network names. Guest Wi-Fi often blocks TV-to-computer traffic ("client isolation"); use the main network.
> - *The Allow prompt never appears.* The TV usually shows it within a few seconds. If not, a previous connection attempt may be stuck: on the TV, Developer options → **Revoke USB debugging authorisations**, then connect again.
> - *It connected yesterday but not today.* The TV's Wi-Fi address changed. Go back to Setup and let it scan again — this is normal after a router restart.

---

## 4. Clean up (choose what goes away)

You will see a list of apps that other TVs like yours disable, each showing its **live state on your TV right now**. Ticked means "switch this off"; unticked stays untouched.

- The app picks the list that matches your TV's model. If your TV isn't in the list, it shows the packages other TVs disable — start conservative.
- **Start with the obvious ad and recommendation apps.** Anything whose name contains *recommend*, *ads*, *live* or a store you never use is a safe first pass. The system apps the TV needs to function are not in the list.
- Press the cleanup button. Each row updates as it goes. Anything that fails is left on and clearly marked — nothing is half-done behind your back.

> **If it didn't work**
>
> - *A row says "failed".* The app leaves that one on and continues with the rest. Some apps refuse to be disabled on certain firmwares; skip them — the rest of the cleanup still counts.
> - *The TV feels slower, or something you use vanished.* Open the same screen later and untick nothing — the screen also lists how to re-enable one app at a time. Or use full **Restore** ([chapter 7](#7-safety-and-rollback)).

---

## 5. Launcher (the new home screen)

This step installs the clean launcher and points the TV's **Home** button at it.

1. Press install. The app pushes the launcher to the TV and hands Home over.
2. Press Home on the TV remote once. You should land on the new, mostly empty home screen.
3. Optionally enable the **Input-key** and **Home-key** helpers — they make the remote's dedicated buttons open the launcher's panels instead of the old launcher's.

> **If it didn't work**
>
> - *Home still opens the old screen.* Press Home a second time — some TVs show a "use which app?" chooser the first time; pick the new launcher and **Always**. If it still lands wrong, the step's rollback runs automatically and tells you; nothing is left half-switched.
> - *I want the old home back.* See [chapter 7](#7-safety-and-rollback) — one toggle, no reinstall.

---

## 6. Customise and finish

- **Customise** — drag your apps into order (the first row becomes the dock), hide the ones you never open, set columns and rows, add a wallpaper (a single picture or a rotating set, including one-click sources like the Bing picture of the day), dim the background, change the greeting, pick a festival skin.
- **TV extras** — a clock screensaver, ad-blocking Private DNS, animation speed, the launcher's language, an on-screen remote, reboot.
- **Finish** — the guide walks you through switching debugging back **off**, then checks that port 5555 is closed. Do this: an open debugging port is a plain-text shell anyone on the Wi-Fi could use, and some TVs don't ask permission again once paired.

The app remembers where you were — close it any time and come back; a TV that already runs the clean launcher opens straight at Customise.

> **If it didn't work**
>
> - *The port check says still open.* Some TVs restart their debugging service when you toggle it — wait a few seconds and press check again. If it stays open, toggle Developer options itself off on the TV; the launcher and your cleanup are unaffected.
> - *The TV got a new IP address.* Nothing is lost. Connect again from Setup; the app recognises the TV by its device identity, not its address, and keeps its restore record.

---

## 7. Safety and rollback

**Disabled vs uninstalled — the difference that matters.**

| | Disabled (what this app does) | Uninstalled (what this app never does) |
|---|---|---|
| Where the app goes | Still on the TV, switched off for your user | Removed from storage |
| Comes back? | Instantly — one toggle or Restore | Only by finding and reinstalling it |
| TV system apps | Untouched | Would break things |
| Storage freed | None | Some |

**Restore — the one-click undo.** Before the first cleanup the app writes a record on your computer: every package's on/off state, and which launcher Home pointed at. Restore replays that record exactly:

- every package you switched off comes back **on**, exactly as it was;
- Home goes back to the launcher you had before — the stock one if you never changed it;
- the record is tied to the TV's device identity, not its IP address, so a TV that moves or gets a new address keeps its history;
- a record from a *different* TV is refused — Restore never applies one TV's list to another.

**Getting the stock launcher back**, step by step: open CleanMyTV → connect → Restore. If you no longer have the app: on the TV, Settings → Apps → the stock launcher → **Enable** (it was disabled, not deleted). Re-enabling debugging works the same way: repeat [chapter 2](#2-prepare-the-tv-5-minutes-one-time) — the seven presses work whether the options are on or off.

---

## 8. Troubleshooting quick table

| Symptom | First thing to try | Section |
|---|---|---|
| TV not found | Same Wi-Fi, same band, not guest network | 3 |
| Allow prompt not appearing | Revoke authorisations on the TV, reconnect | 3 |
| Home didn't switch | Press Home again; pick "Always" in the chooser | 5 |
| A package refused to disable | Leave it on; everything else still worked | 4 |
| Something I use got disabled | Re-enable it one-by-one, or Restore | 7 |
| TV got a new IP | Just reconnect; the app knows the TV by identity | 6 |
| Port check says still open | Wait a few seconds, or toggle Developer options off | 6 |
| Want everything back | Restore — one click | 7 |

---

*Guide version: v0.1 (2026-10-26). Written to match app v0.1; when the app's steps change, this guide is the place to update, alongside the README screenshots.*
