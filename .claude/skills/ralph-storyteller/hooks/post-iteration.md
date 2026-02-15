# Post-Iteration Hook

This hook runs after each Ralph iteration completes.

## Trigger

When Ralph outputs:
- `<promise>ITERATION_DONE</promise>` - Continue to next task
- `<promise>COMPLETE</promise>` - All tasks done, stop loop
- `<promise>BLOCKED:[reason]</promise>` - Human intervention needed

## Behavior

### On ITERATION_DONE
1. Log iteration completion to `ralph/stories-progress.txt`
2. Increment iteration counter in database
3. Automatically invoke `/ralph-stories` to continue loop

### On COMPLETE
1. Log completion to progress file
2. Generate summary report
3. Notify user of completion
4. Suggest running `/ralph-stories-review`

### On BLOCKED
1. Log blocking reason
2. Halt loop
3. Alert user with specific issue
4. Suggest resolution steps

## Implementation Note

For Claude Code, this hook pattern is implemented through the command's instruction
to output specific promise tags. The calling system (or human) should watch for
these tags and take appropriate action.

For fully autonomous operation, use the Ralph agent via Claude Agent SDK with
a wrapper that handles the promise tags and continues the loop.
