import runpy
import traceback

def main():
    path = 'project/settings.py'
    try:
        ns = runpy.run_path(path, run_name='__main__')
        print('executed ok')
        print('has_timedelta=', 'timedelta' in ns)
        print('timedelta=', repr(ns.get('timedelta')))
    except Exception:
        print('execution failed, partial namespace keys:')
        tb = traceback.format_exc()
        print(tb)
        # Try to read file and show top 40 lines for context
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        print('\n'.join(lines[:40]))

if __name__ == '__main__':
    main()
