1. add provider to settings from selectable - open ai, claude, groq, google - is done:[]
2. fix setting page to be look just like the other components, currenlt the left navbar is disappearing, the theme is disappearing - is done:[]
3. fix theme colors for dark mode - currently in dark mode the fonts are not looking good - is done:[]
4. change the favicon in the tab and generate a logo with a niuce facivon - is done:[]
5. change name for the app - is done:[]
6. introduce setting for browser agent max steps - is done:[]
7. remove the reports table from datamodel and table - is done:[]
8. rename AgentRun to PersonaRun
9. for Status in persona runsi want 3 types of status, success when is_done = true and judgement_data verdict is true and failure_reason is  empty, failed presented in red   is_done = true judgement_data verdict is false and failure_reason is not empty, error in purple in the ui for is_done = false
10. think to remove journey_path i think it is confusing
11. check why backgroudn tasks are running sequentially instead of async, so wierd
12. ERROR: Task timeout after 600 seconds happens toi many times, remove it and try to write exceptions better for the persona run object anyway it is important to document its navigations steps
13. imrpove code readbility, reuse, strucutre, and wirting of ui
14. imrpove code readbility, reuse, strucutre, and wirting of backend

Browser use
error in browser use run check if and how can take care of
1. ⚠️  WARNING: Total EventBus memory usage is 55.3MB (>50MB limit)
2. check why even if headless = true, it still opens a chromium borwser in the background that i see
