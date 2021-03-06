import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import localForage from 'localforage'

// Import form components
import NewTempUserForm from '../../../forms/NewTempUserForm'

// Import components
import Box from '@mui/material/Box'
import ClientProfile from '../../../components/ClientProfile'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Layout from '../../../layout/layout'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import ResponsiveDialog from '../../../components/ResponsiveDialog'
import Spinner from '../../../components/spinner'
import Toast from '../../../components/toast'
import Typography from '@mui/material/Typography'

// Import icons
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';


const ClientList = () => {
    // Get businessId from url
    const router = useRouter()
    const businessId = router.query.businessId

    // State management
    const [modalState, setModalState] = useState(false)
    const [clientModalOpen, setClientModalOpen] = useState(false)
    const [clientModalData, setClientModalData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [clientList, setClientList] = useState(null)
    const [refreshList, setRefreshList] = useState(true)
    const [responseMessage, setResponseMessage] = useState(null)

    // Get client list
    useEffect(() => {
        const requestHandler = async () => {
            try {
                // Start spinner
                setIsLoading(true)

                // Request client list
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/client-list/${businessId}`, {
                    headers: {
                        'Authorization': `Bearer ${await localForage.getItem('accessToken')}`
                    }
                })
                const data = await response.json()

                // Throw error if response is not ok
                if (!response.ok) {
                    throw {
                        status: data.status,
                        message: data.message
                    }
                }

                // Request was susccessful, stop spinner
                setIsLoading(false) 

                // Set client list
                setClientList(data.clients)
                // If the client modal is open then update modal data
                if(clientModalData) {
                    setClientModalData(data.clients.filter(client => client._id === clientModalData._id)[0])
                }

               // Don't set a response message as loading the client list is expected to be successful on page load
                
            } catch (err) {
                console.log(err)

                // Stop spinner
                setIsLoading(false)

                // Show error message
                setResponseMessage({
                    status: err.status,
                    message: err.message,
                    severity: "error"
                })
            }
        }

        if(businessId && refreshList) {
            requestHandler()
            setRefreshList(false)
        }

    }, [businessId, refreshList])

  return (
    <>
        <Head>
            <title>AppointMe: Client List</title>
        </Head>
        <Layout page="Clients">
            <Box sx={styles.innerBox}>
                <List>
                    <ListSubheader sx={styles.clientList.header} >
                        <Box  sx={styles.clientList.header.detail}>
                            <Box>Clients: {clientList ? clientList.length : 0}</Box>
                            <IconButton variant="outlined" onClick={() => setModalState(true)}>
                                <AddCircleOutlineRoundedIcon sx={styles.clientList.addIcon} />
                            </IconButton>
                        </Box>
                        <Divider sx={styles.clientList.divider} flexItem />
                    </ListSubheader>
                    {clientList && clientList.map((client, index) => (
                        <Box 
                            sx={styles.clientList.link} 
                            key={index}
                            onClick={() => {setClientModalOpen(true); setClientModalData(client)}}
                        >
                            <ListItem sx={styles.clientList.listItem}>
                                <ListItemText 
                                    primary={`${client.user.fname} ${client.user.lname}`} 
                                    secondary={client.user.email} 
                                    primaryTypographyProps={{variant: "h5"}}
                                    secondaryTypographyProps={{variant: "caption"}}
                                />
                                <ArrowForwardIosRoundedIcon />
                            </ListItem>
                            <Divider sx={styles.clientList.divider} flexItem variant='middle' />
                        </Box>
                    ))}
                    <Typography sx={styles.clientList.caption} variant="caption" component='div' align="center">-- END OF LIST --</Typography>
                </List>
            </Box>

            <Toast response={responseMessage} setResponse={setResponseMessage} hideIn={6000} />
            <Spinner open={isLoading} dialogStyle={styles.spinDialog} spinStyle={styles.spinStyle} />

            <ResponsiveDialog sx={styles.formDialog} open={modalState} onClose={() => setModalState(false)}>
                <DialogTitle variant="h4" align="center">
                    Add New Client
                </DialogTitle>
                <DialogContent>
                    <NewTempUserForm
                        refreshClientList={() => setRefreshList(true)} 
                        closeDialog={() => setModalState(false)} 
                        businessId={businessId} 
                        setResponseMessage={setResponseMessage}    
                    />
                </DialogContent>
            </ResponsiveDialog>
            <ResponsiveDialog
                open={clientModalOpen}
                onClose={() => {setClientModalOpen(false); setClientModalData(null);}}
            >
                <ClientProfile
                    userData={clientModalData}
                    refreshClientList={() => setRefreshList(true)} 
                    businessId={businessId}
                    setResponseMessage={setResponseMessage}
                    closeDialog={() => setClientModalOpen(false)}
                />
            </ResponsiveDialog>
        </Layout>
    </>
  )
}

export default ClientList

const styles = {
    innerBox: {
        maxWidth: 500,
        mx: 'auto',
        px: 0,
        mt: {sm: 3},
    },
    clientList: {
        width: "100%",
        header: {
            display: 'flex',
            flexDirection: 'column',
            alignContent: 'center',
            detail: {
                display: 'flex',
                justifyContent: 'space-between',
            },
        },
        addIcon: {
            fontSize: '2rem',
        },
        divider: {
            borderColor: 'custom.contrastTextLight'
        },
        listItem: {
            color: 'custom.contrastText',
            px: 3,
            '&:hover': {
                color: "custom.contrastTextStrong",
                backgroundImage: (theme) => theme.palette.custom.gradient.light,
            },
        },
        link: {
            textDecoration: 'none',
            "&:hover .MuiDivider-root": {
                borderColor: 'custom.contrastText'
            }
        },
        caption: {
            py: 1,
            color: 'custom.contrastText',
        }
    },
    formDialog: {
        color: "custom.constrastText" 
    },
    spinDialog: {
        backgroundImage: (theme) => theme.palette.custom.gradient.medium
    },
    spinStyle: {
        m: 6,
    },

}