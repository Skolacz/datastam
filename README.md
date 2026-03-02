# datastam
JOBS
Backend Lead - Tiffany
Frontend Lead - Aiden
AI/prompts lead - Khris
Integration Lead - Brady
And a QA & Doc Lead - Alex


1. Download this https://git-scm.com/install/windows
2. open powershell
3. run 
git clone https://github.com/Skolacz/datastam.git
If that doesnt work you may have to replace the Skolacz with your github user name
4. open VS code
5. File
6. Open folder
7. Select datastam
8. Select folder button
12. Once selected in the lower left hand side of the screen you will see the same two arrows folowed by the branch symbol and main. That means you are on the main branch of out project. This is not where you make your edits. You will need to create your own branches to do your edits and then it will be merged into the main branch at the end. Please make sure your branch names are productive or else its a bitch to try and figure out what exactly you changed.

Every time you start a new editing session please run steps 1 and 2 in "how to make a branch" Its very important so that everything is up to date for everyone

How to make a branch
1. In powershell run the path to your datastam folder on your computer. Mine is C:\Users\sarak\datastam so in that case you put cd infront of it meaning the command is
   cd C:\Users\sarak\datastam
   for me
2. run
   git checkout main
   git pull origin main
   This makes sure that you are using the most up to date verson of our code
4.Then you can create your branch. For each large change you make you should use a new branch. That way whe you push them you dont have to worry about multipul changes happening at once
5. To creat a branch run
6. git checkout -b (what ever you want to call your branch)
   you sould be specific such as "sara-colour-changes-to-upper-nav-bar" so that who ever is reviewing it know swhat to look for and knows who it came from
7. Once that is done the branch name in the lower left of VS code should change
8. You cannot switch out of a branch without saving your changes

If you ever dont know what brnch you are on run 
git branch
and it will tell you the branches you have created up until this point as well as highlight which one you are on.
   
