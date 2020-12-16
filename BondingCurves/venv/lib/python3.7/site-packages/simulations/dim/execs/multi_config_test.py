from tabulate import tabulate
from pprint import pprint
import pandas as pd

from cadCAD.engine import ExecutionMode, ExecutionContext, Executor
from simulations.dim.models import config1, config2
from simulations.dim import dim_exp

exec_mode = ExecutionMode()

local_proc_ctx = ExecutionContext(context=exec_mode.local_mode)
run = Executor(exec_context=local_proc_ctx, configs=dim_exp.configs)
# exit()

raw_result, tensor_fields, sessions = run.execute()
result = pd.DataFrame(raw_result)
# print(len(result.index))
# pprint(dim_exp.configs)
# print(tabulate(tensor_fields[0], headers='keys', tablefmt='psql'))
# pprint(sessions)
print(tabulate(result, headers='keys', tablefmt='psql'))
