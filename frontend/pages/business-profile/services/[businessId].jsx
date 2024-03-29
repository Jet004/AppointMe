import { useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import userContext from '../../../utility/appContext'

// Import components
import Box from '@mui/material/Box'
import BusinessProfileLayout from '../../../layout/businessProfileLayout'
import FeatureBox from '../../../components/featureBox'
import Link from '../../../components/link'
import Spinner from '../../../components/spinner'
import Toast from '../../../components/toast'
import Typography from '@mui/material/Typography'

// Import icons
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'

export default function Login() {
    // Set up router object so we can get url query params
    const router = useRouter()
    // Get businessId from url query params
    const businessId = router.query.businessId
    // Get access to user context
    const userData = useContext(userContext)

    // State Management
    const [isLoading, setIsLoading] = useState(false)
    const [responseMessage, setResponseMessage] = useState(null)
    const [services, setServices] = useState(null)

    // useEffect to get services data
    useEffect(() => {
        const getServicesData = async () => {
            try {
                // Start spinner
                setIsLoading(true)

                // Get services data
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/services/${businessId}`)
                const data = await response.json()
                
                // Stop spinner
                setIsLoading(false)

                // Throw and error if response failed
                if(!response.ok) {
                    throw {
                        status: data.status,
                        message: data.message
                    }
                }
                
                // Successful response, set state
                setServices(data.services)
            } catch(e) {
                console.log(e)
                
                // Stop spinner
                setIsLoading(false)

                setResponseMessage({
                    status: "error",
                    message:  `Error loading data ${e.message}`,
                    severity: "error"
                })
            }
        }

        // Prevent fetch if businessId has not yet been set by Next.js
        if(businessId) {
            getServicesData()
        }
    }, [businessId])

    return (
        <>
            <BusinessProfileLayout logo="thumb" title="Services" page="Services">
                <Box sx={styles.innerBox}>
                    <Typography sx={styles.title} gutterBottom variant="h2">
                        Services We Offer
                    </Typography>

                    <Typography variant="body1" gutterBottom>
                        We offer a variety of comprehensive tutoring services to meet your needs.
                    </Typography>
                    { services && services.map((service) => (
                        <FeatureBox 
                            sx={styles.service} 
                            title={service.name}
                            key={service._id}   
                        >
                            <Typography sx={styles.service.content} variant="body1" component="div" gutterBottom>
                                {service.description}
                                <ul>
                                    <li><Typography variant="body2">Appointment Duration: {service.duration + service.break} minute class</Typography></li>
                                    <li><Typography variant="body2">Appointment Fee: ${service.fee}</Typography></li>
                                </ul>
                                { userData.loggedIn && (
                                    <Link sx={styles.service.link} href={`/business-profile/appointments/${businessId}/?service=${service.name}`}><EventAvailableRoundedIcon /> Make an appointment!</Link>
                                )}
                                { !userData.loggedIn && (
                                    <Link sx={styles.service.link} href={`/business-profile/appointments/${businessId}/?service=${service.name}`}><TodayRoundedIcon /> Check our available class times</Link>
                                )}
                            </Typography>
                        </FeatureBox>
                    ))}
                    
                    <Typography variant="h4" gutterBottom>We&apos;re dedicated to your success!</Typography>
                    <Toast response={responseMessage} setResponse={setResponseMessage} hideIn={6000} />
                    <Spinner open={isLoading} />
                </Box>
            </BusinessProfileLayout>
        </>
    )
}


const styles = {
    innerBox: {
        mt: {sm: 2, md: 0},
        width: "90%",
        maxWidth: 800,
        color: "custom.contrastText",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    },
    title: {
        mt: 2
    },
    service: {
        width: "100%",
        my: 3,
        content: {
            color: theme => theme.palette.mode === 'dark' ? 'custom.contrastText' : 'custom.highlight',
            pt: 1,
            pb: 3,
            px: 3
        },
        link: {
            color: theme => theme.palette.mode === 'dark' ? 'custom.contrastText' : 'custom.highlight',
            display: "flex",
            alignItems: "center",
            "& svg": {
                mr: 1,
            }
        }
    },
}
