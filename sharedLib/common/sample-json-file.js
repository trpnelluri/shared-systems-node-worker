'use strict'

const msgDataObj = [{
    'intrfc_id':1,
    'schdl_type_ind':'1',
    'intrvl_prd':1,
    'strt_by_date':'2016-05-31T16:01:00.000Z',
    'end_by_date':'2016-05-31T16:01:00.000Z',
    'rcvd_by_name':'',
    'to_char':'12',
    'data_cntr_id':1,
    'data_cntr_name':'DXC',
    'clm_type_id':2,
    'clm_type_ind':'A',
    'clm_type_name':'PARTA',
    'fil_name_tmplt':'DBR.T.DXC000.ESMD00.SS.PRTA.D{0}.T{1}0',
    'intrfc_desc':'DXC',
    'src_sys_name':'/esmd/temp/',
    'trgt_sys_name':'/esmd/ss/inbound/filetransfer/dbr/',
    'job_que_name':'IB.SS.SCHEDULER.BATCH.FLATFILE.TRIGGER'
}];

module.exports = {
    msgDataObj
};