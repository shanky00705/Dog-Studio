import React, { useEffect, useRef } from 'react'
import * as THREE from "three"
import { useThree } from '@react-three/fiber'
import { useGLTF, useTexture, useAnimations } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

const Dog = () => {

  gsap.registerPlugin(ScrollTrigger)

  const model = useGLTF("/models/dog.drc.glb")

  useThree(({ camera, gl }) => {
    camera.position.z = 0.6
    gl.toneMapping = THREE.ReinhardToneMapping
    gl.outputColorSpace = THREE.SRGBColorSpace
  })

  const { actions } = useAnimations(model.animations, model.scene)

  useEffect(() => {
    actions["Take 001"]?.play()
  }, [actions])

  // ---------------- TEXTURES ----------------

  const [normalMap] = useTexture(["/dog_normals.jpg"]).map((t) => {
    t.flipY = false
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })

  const [branchMap, branchNormalMap] = useTexture([
    "/branches_diffuse.jpeg",
    "/branches_normals.jpeg"
  ]).map((t) => {
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })

  const matcaps = useTexture([
    "/matcap/mat-1.png","/matcap/mat-2.png","/matcap/mat-3.png",
    "/matcap/mat-4.png","/matcap/mat-5.png","/matcap/mat-6.png",
    "/matcap/mat-7.png","/matcap/mat-8.png","/matcap/mat-9.png",
    "/matcap/mat-10.png","/matcap/mat-11.png","/matcap/mat-12.png",
    "/matcap/mat-13.png","/matcap/mat-14.png","/matcap/mat-15.png",
    "/matcap/mat-16.png","/matcap/mat-17.png","/matcap/mat-18.png",
    "/matcap/mat-19.png","/matcap/mat-20.png",
  ]).map(t => {
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })

  const [
    mat1, mat2, mat3, mat4, mat5,
    mat6, mat7, mat8, mat9, mat10,
    mat11, mat12, mat13, mat14, mat15,
    mat16, mat17, mat18, mat19, mat20
  ] = matcaps

  // ---------------- UNIFORMS ----------------

  const material = useRef({
    uMatcap1: { value: mat19 },
    uMatcap2: { value: mat2 },
    uProgress: { value: 0.0 } // ✅ start FULL matcap2
  })

  // ---------------- SHARED SHADER ----------------

  function sharedShader(shader) {
    shader.uniforms.uMatcapTexture1 = material.current.uMatcap1
    shader.uniforms.uMatcapTexture2 = material.current.uMatcap2
    shader.uniforms.uProgress = material.current.uProgress

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
      uniform sampler2D uMatcapTexture1;
      uniform sampler2D uMatcapTexture2;
      uniform float uProgress;

      void main() {
      `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 matcapColor = texture2D( matcap, uv );",
      `
      vec4 matcapColor1 = texture2D( uMatcapTexture1, uv );
      vec4 matcapColor2 = texture2D( uMatcapTexture2, uv );

      float progress = smoothstep(0.0, 1.0, uProgress);

      vec4 matcapColor = mix(matcapColor2, matcapColor1, progress);
      `
    )
  }

  // ---------------- MATERIALS ----------------

  const dogMaterial = new THREE.MeshMatcapMaterial({
    normalMap,
    matcap: mat2
  })

  const branchMaterial = new THREE.MeshMatcapMaterial({
    normalMap: branchNormalMap,
    matcap: mat2
  })

  dogMaterial.onBeforeCompile = sharedShader
  branchMaterial.onBeforeCompile = sharedShader

  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: "black"
  })

  // ---------------- APPLY MATERIALS ----------------

  useEffect(() => {
    model.scene.traverse((child) => {
      if (child.isMesh) {

        const name = child.name.toLowerCase()

        if (name.includes("eye")) {
          child.material = eyeMaterial
        } else if (name.includes("dog")) {
          child.material = dogMaterial
        } else {
          child.material = branchMaterial
        }

      }
    })
  }, [])

  // ---------------- GSAP SCROLL ----------------

  const dogModel = useRef(model)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-1",
        endTrigger: "#section-3",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      }
    })

    tl.to(dogModel.current.scene.position, {
      z: "-=0.75",
      y: "+=0.1"
    })
    .to(dogModel.current.scene.rotation, {
      x: `+=${Math.PI / 15}`,
    })
    .to(dogModel.current.scene.rotation, {
      y: `-=${Math.PI}`,
    }, "third")
    .to(dogModel.current.scene.position, {
      x: "-=0.5",
      y: "-=0.05",
      z: "+=0.6"
    }, "third")
  }, [])

  // ---------------- HOVER ----------------

  useEffect(() => {

    const animateMatcap = (mat) => {
      material.current.uMatcap1.value = mat

      gsap.to(material.current.uProgress, {
        value: 1.0,
        duration: 0.3,
        onComplete: () => {
          material.current.uMatcap2.value = mat
          material.current.uProgress.value = 0.0
        }
      })
    }

    document.querySelector(`.title[img-title="tomorrowland"]`)?.addEventListener("mouseenter", () => animateMatcap(mat19))
    document.querySelector(`.title[img-title="navy-pier"]`)?.addEventListener("mouseenter", () => animateMatcap(mat8))
    document.querySelector(`.title[img-title="msi-chicago"]`)?.addEventListener("mouseenter", () => animateMatcap(mat9))
    document.querySelector(`.title[img-title="phone"]`)?.addEventListener("mouseenter", () => animateMatcap(mat12))
    document.querySelector(`.title[img-title="kikk"]`)?.addEventListener("mouseenter", () => animateMatcap(mat10))
    document.querySelector(`.title[img-title="kennedy"]`)?.addEventListener("mouseenter", () => animateMatcap(mat8))
    document.querySelector(`.title[img-title="opera"]`)?.addEventListener("mouseenter", () => animateMatcap(mat13))

    document.querySelector(`.titles`)?.addEventListener("mouseleave", () => animateMatcap(mat2))

  }, [])

  // ---------------- JSX ----------------

  return (
    <>
      <primitive
        object={model.scene}
        position={[0.18, -0.62, 0]}
        rotation={[0, Math.PI / 5.5, 0]}
      />
      <directionalLight position={[0, 5, 5]} intensity={15} />
    </>
  )
}

export default Dog