import dill
import pandas as pd
from tabulate import tabulate

from cadCAD.engine import ExecutionMode, ExecutionContext, Executor
from simulations.regression_tests.poc_configs.configure import poc

exec_mode = ExecutionMode()

local_proc_ctx = ExecutionContext(context=exec_mode.multi_mode)
executor = Executor(exec_context=local_proc_ctx, configs=poc.configs)

raw_result, tensor_fields, sessions = executor.execute()
result = pd.DataFrame(raw_result)
print(tabulate(result, headers='keys', tablefmt='psql'))