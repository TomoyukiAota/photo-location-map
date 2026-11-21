# Two instances on one profile: report

2026-11-21 (Asia/Tokyo). A launch while another instance of the application ran
on the same profile waited about 4 s before its page ran the app's code, as
when Explorer's "Open with Photo Location Map" is used while the application
runs, or on two items at once. The loading text showed meanwhile
([the loading screen's report](../20261121_launch-loading-screen/REPORT.md)),
but the wait stayed. The owner chose the change that this records: an instance
that starts while another runs keeps Chromium's storage in a folder of its own.

## Why the page waited

- **Each launch is a process of its own on the same profile.** Explorer starts
  one for each item that it opens. The application's own files in `userData`
  are made for that: each launch has its file, and the analytics backend keeps
  the unsent events of each process apart. Chromium's storage is in the
  profile too (`sessionData`, which is `userData` unless it is set): Local
  Storage, IndexedDB, cookies and the HTTP cache.
- **Chromium lets one process at a time open a database of that storage.** At
  its start, the page opens three IndexedDB databases: Amplitude's diagnostics
  (`AMP_diagnostics_<key>`, though the app turns its diagnostics off), and
  Mixpanel's `mixpanelBrowserDb` and `mixpanelFlagsDb` (though the app records
  no sessions and uses no flags). It also calls Web Storage synchronously
  during `mixpanel.init()`: the queues of unsent events and the tab's ID.
- **The second page waited for the first's database.** Chromium tried again
  each second to open the IndexedDB that the other process held, and wrote
  `Failed to open LevelDB database ... LOCK` each time. The page's synchronous
  call to Web Storage waited behind it: about 4 s, after which Chromium gave
  up the database. A bare Electron page on one profile shared by two processes
  did the same: its first `localStorage` call took about 3 s right after
  `indexedDB.open()` while the other process held the database, and 13–34 ms
  without it.

## Measurements

macOS (Apple M5), the production build, hidden windows, test profiles, two
launches on one profile, online. In ms from each launch's start; the page's
wait is from its arrival to the app's code.

| Case | Before | After |
| --- | --- | --- |
| Second launch 2.5 s after the first, which keeps running | The second page waited 4,078–4,093 ms (3 of 3); its home view at 4.45–4.64 s | It waited 78–83 ms; its home view at 0.46–0.49 s |
| Two launches at once | About 4 s in both pages in 2 of 5 rounds, about 0.6 s in one in the other 3; home views at up to 4.49 s | 72–97 ms in each of the 10 pages; home views at 0.46–0.52 s |

- Chromium wrote `Failed to open LevelDB database ... LOCK` 16 and 8 times
  in those runs before the change, and never after it.
- The instance with a storage of its own starts with empty caches: its home
  view came 0.46–0.49 s after its start, against 0.41 s for the first launch,
  and it downloads the map's tiles and the fonts again.
- Not chosen, after trying it: `app.requestSingleInstanceLock()` to tell
  whether another instance runs, while the new instance keeps running. In 5 of
  10 tries, the instance that did not get Chromium's lock stopped during its
  start, and in one, both instances used the profile's storage.

## What changed

- `src-main/session-data/`: the instance that creates
  `userData/instances/shared-session-data.lock` keeps Chromium's storage in
  the profile, as before. The file holds its process ID, and is removed when
  it quits, or, on Windows, when a shutdown or a log-off ends it. A lock whose
  process has ended, or that was written before the computer last started, is
  taken over. Any other instance sets `sessionData` to
  `userData/instances/<process ID>` before the app is ready.
- Each launch removes, once the app is ready, the folders of the instances
  that have ended.
- The settings, the thumbnails and the other files of the application stay
  shared, as before.

## Not changed

- Two instances started in the same millisecond write to one log file, whose
  name is the time to the millisecond.
- A process ID that another process takes before the computer restarts, after
  the instance that held the lock crashed: the lock is then thought held, and
  each new instance keeps a storage of its own until that process ends.

## Checking it on Windows

1. Start the application, then use "Open with Photo Location Map" on a folder
   in Explorer: a second window opens.
2. In `%APPDATA%\Photo Location Map\logs\`, the newest log file says
   "[Session Data] This instance keeps Chromium's storage in a folder of its
   own: ...", and "[Leaflet Map] Fetching
   https://raw.githubusercontent.com/..." comes about 0.1 s after "Launching
   the main window." rather than about 4 s after it.
3. Quit both. The next launch removes the folder of the second in
   `%APPDATA%\Photo Location Map\instances\`.
